import {flatten} from 'lodash';
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
import {makeKey, toArray, toNonNullableArray} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resource';
import {reuseableErrors} from '../../utils/reusableErrors';
import {ISemanticDataAccessProviderMutationRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {checkResourcesBelongToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';
import {IFetchResourceItem} from '../resources/types';
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
    checkBelongsToWorkspace: true,
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
  return await INTERNAL_getResources({
    context,
    agent,
    workspaceId: workspace.resourceId,
    allowedTypes: getWorkspaceResourceTypeList(),
    inputResources: toArray(target).map((nextTarget): IFetchResourceItem => {
      return {
        resourceId: nextTarget.targetId,
        filepath: nextTarget.filepath,
        folderpath: nextTarget.folderpath,
        workspaceRootname: nextTarget.workspaceRootname,
      };
    }),
    checkAuth: true,
    checkBelongsToWorkspace: true,
    action: AppActionType.Read,
  });
}
