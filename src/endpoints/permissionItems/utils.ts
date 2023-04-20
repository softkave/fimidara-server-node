import {flatten} from 'lodash';
import {PermissionItem, PublicPermissionItem} from '../../definitions/permissionItem';
import {
  Agent,
  AppActionType,
  AppResourceType,
  SessionAgent,
  getWorkspaceResourceTypeList,
} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {makeKey, toArray, toNonNullableArray} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resource';
import {reuseableErrors} from '../../utils/reusableErrors';
import {SemanticDataAccessProviderMutationRunOptions} from '../contexts/semantic/types';
import {BaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {checkResourcesBelongToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';
import {FetchResourceItem} from '../resources/types';
import {workspaceResourceFields} from '../utils';
import {INTERNAL_addPermissionItems} from './addItems/utils';
import {DeletePermissionItemInput} from './deleteItems/types';
import {INTERNAL_deletePermissionItems} from './deleteItems/utils';
import {PermissionItemInput, PermissionItemInputEntity, PermissionItemInputTarget} from './types';

const permissionItemFields = getFields<PublicPermissionItem>({
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
  context: BaseContext;
  agent: Agent;
  workspace: Workspace;
  opts: SemanticDataAccessProviderMutationRunOptions;
  items?: PermissionItemInput[];
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

export interface PermissionItemBase {
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

export const permissionItemIndexer = (item: PermissionItemBase) => {
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

export function assertPermissionItem(item?: PermissionItem | null): asserts item {
  appAssert(item, reuseableErrors.permissionItem.notFound());
}

export async function getPermissionItemEntities(
  context: BaseContext,
  agent: SessionAgent,
  workspaceId: string,
  entities: PermissionItemInputEntity[]
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
  context: BaseContext,
  agent: SessionAgent,
  workspace: Workspace,
  target: Partial<PermissionItemInputTarget> | Partial<PermissionItemInputTarget>[]
) {
  return await INTERNAL_getResources({
    context,
    agent,
    workspaceId: workspace.resourceId,
    allowedTypes: getWorkspaceResourceTypeList(),
    inputResources: toArray(target).map((nextTarget): FetchResourceItem => {
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
