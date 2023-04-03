import {compact, flatten, map} from 'lodash';
import {IPermissionItem, IPublicPermissionItem} from '../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  IAgent,
  ISessionAgent,
  getWorkspaceResourceTypeList,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {makeKey, toNonNullableArray} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resource';
import {reuseableErrors} from '../../utils/reusableErrors';
import {ISemanticDataAccessProviderMutationRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {folderConstants} from '../folders/constants';
import {checkResourcesBelongToWorkspace} from '../resources/containerCheckFns';
import {IFetchResourceItemWithAction, INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';
import {workspaceResourceFields} from '../utils';
import {INTERNAL_addPermissionItems} from './addItems/utils';
import {DeletePermissionItemInput} from './deleteItems/types';
import {INTERNAL_deletePermissionItems} from './deleteItems/utils';
import {
  IPermissionItemInput,
  IPermissionItemInputEntity,
  IPermissionItemInputTarget,
} from './types';

const permissionItemFields = getFields<IPublicPermissionItem>({
  ...workspaceResourceFields,
  entityId: true,
  entityType: true,
  targetId: true,
  targetType: true,
  action: true,
  grantAccess: true,
  appliesTo: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);
export const permissionItemListExtractor = makeListExtract(permissionItemFields);

export function throwPermissionItemNotFound() {
  throw reuseableErrors.permissionItem.notFound();
}

export async function updatePublicPermissionGroupAccessOps(props: {
  context: IBaseContext;
  agent: IAgent;
  workspace: IWorkspace;
  opts: ISemanticDataAccessProviderMutationRunOptions;
  items?: IPermissionItemInput[];
  deleteItems?: DeletePermissionItemInput[];
}) {
  const {context, agent, workspace, items, opts, deleteItems} = props;

  if (deleteItems?.length) {
    await INTERNAL_deletePermissionItems(context, agent, workspace, {
      entity: {entityId: workspace.publicPermissionGroupId},
      items: deleteItems,
    });
  }

  if (items?.length) {
    await INTERNAL_addPermissionItems(
      context,
      agent,
      workspace,
      {
        items,
        workspaceId: workspace.resourceId,
        entity: {entityId: workspace.publicPermissionGroupId},
      },
      opts
    );
  }
}

export interface IPermissionItemBase {
  containerId: string;
  targetId?: string;
  targetType: AppResourceType;
  entityId: string;
  action: AppActionType;
  grantAccess?: boolean;
  isForPermissionContainer?: boolean;
}

export abstract class PermissionItemUtils {
  static extractPublicPermissionItem = permissionItemExtractor;
  static extractPublicPermissionItemList = permissionItemListExtractor;
}

export function getTargetType(data: {targetId?: string; targetType?: AppResourceType}) {
  const targetType = data.targetType
    ? data.targetType
    : data.targetId
    ? getResourceTypeFromId(data.targetId)
    : null;
  appAssert(targetType, new InvalidRequestError('Target ID or target type must be present'));
  return targetType;
}

export const permissionItemIndexer = (item: IPermissionItemBase) => {
  return makeKey([
    item.entityId,
    item.containerId,
    item.targetId,
    item.targetType,
    item.action,
    item.grantAccess,
    item.isForPermissionContainer,
  ]);
};

export function assertPermissionItem(item?: IPermissionItem | null): asserts item {
  appAssert(item, reuseableErrors.permissionItem.notFound());
}

export async function getPermissionItemEntities(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  entities: IPermissionItemInputEntity[]
) {
  let resources = await INTERNAL_getResources({
    context,
    agent,
    allowedTypes: [
      AppResourceType.User,
      AppResourceType.PermissionGroup,
      AppResourceType.AgentToken,
    ],
    workspaceId,
    inputResources: flatten(
      entities.map(entity =>
        toNonNullableArray(entity.entityId).map(entityId => ({resourceId: entityId}))
      )
    ),
    checkAuth: true,
    action: AppActionType.Read,
  });
  resources = await resourceListWithAssignedItems(context, workspaceId, resources, [
    AppResourceType.User,
  ]);
  checkResourcesBelongToWorkspace(workspaceId, resources);
  return resources;
}

export async function getPermissionItemTargets(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  target: Partial<IPermissionItemInputTarget> | Partial<IPermissionItemInputTarget>[]
) {
  const itemsToFetch: Record<string, IFetchResourceItemWithAction> = {};
  const filepaths: Record<string, string> = {};
  const folderpaths: Record<string, string> = {};
  const targets = toNonNullableArray(target);
  targets.forEach(nextTarget => {
    if (nextTarget.targetId) {
      toNonNullableArray(nextTarget.targetId).forEach(targetId => {
        itemsToFetch[targetId] = {resourceId: targetId};
      });
    }
    if (nextTarget.filepath) {
      toNonNullableArray(nextTarget.filepath).forEach(filepath => {
        itemsToFetch[filepath] = {resourceId: filepath};
      });
    }
    if (nextTarget.folderpath) {
      toNonNullableArray(nextTarget.folderpath).forEach(folderpath => {
        itemsToFetch[folderpath] = {resourceId: folderpath};
      });
    }
    if (nextTarget.targetType) {
      toNonNullableArray(nextTarget.targetType).forEach(targetType => {
        itemsToFetch[targetType] = {resourceId: targetType};
      });
    }
    if (nextTarget.workspaceRootname) {
      // TODO: should we instead fetch all and pull offending inputs together
      // and return with those?
      appAssert(
        workspace.rootname === nextTarget.workspaceRootname,
        new InvalidRequestError(
          `Unknown workspace rootname ${nextTarget.workspaceRootname} provided in permission targets.`
        )
      );
    }
  });

  const fetchItemsToFetch = async () => {
    let resources = await INTERNAL_getResources({
      context,
      agent,
      workspaceId: workspace.resourceId,
      allowedTypes: getWorkspaceResourceTypeList(),
      inputResources: Object.values(itemsToFetch),
      checkAuth: true,
      action: AppActionType.Read,
    });
    resources = await resourceListWithAssignedItems(context, workspace.resourceId, resources, [
      AppResourceType.User,
    ]);
    checkResourcesBelongToWorkspace(workspace.resourceId, resources);
    return resources;
  };

  const fetchFiles = async () => {
    const result = await Promise.all(
      // TODO: can we have $or or implement $in for array of arrays?
      map(filepaths, filepath =>
        context.semantic.file.getOneByNamePath(
          workspace.resourceId,
          filepath.split(folderConstants.nameSeparator)
        )
      )
    );
    return compact(result);
  };

  const fetchFolders = async () => {
    const result = await Promise.all(
      // TODO: can we have $or or implement $in for array of arrays?
      map(folderpaths, folderpath =>
        context.semantic.folder.getOneByNamePath(
          workspace.resourceId,
          folderpath.split(folderConstants.nameSeparator)
        )
      )
    );
    return compact(result);
  };

  // TODO: check target types are types contained in container's type

  const [resources, files, folders] = await Promise.all([
    fetchItemsToFetch(),
    fetchFiles(),
    fetchFolders(),
  ]);

  files.forEach(file => {
    resources.push({
      resource: file,
      resourceId: file.resourceId,
      resourceType: AppResourceType.File,
    });
  });
  folders.forEach(folder => {
    resources.push({
      resource: folder,
      resourceId: folder.resourceId,
      resourceType: AppResourceType.Folder,
    });
  });

  return resources;
}
