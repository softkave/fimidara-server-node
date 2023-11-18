import {PermissionItem, PublicPermissionItem} from '../../definitions/permissionItem';
import {
  AppResourceType,
  SessionAgent,
  getWorkspaceResourceTypeList,
} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {toArray} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resource';
import {reuseableErrors} from '../../utils/reusableErrors';
import {BaseContextType} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {checkResourcesBelongsToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';
import {FetchResourceItem} from '../resources/types';
import {workspaceResourceFields} from '../utils';
import {PermissionItemInputTarget} from './types';

const permissionItemFields = getFields<PublicPermissionItem>({
  ...workspaceResourceFields,
  entityId: true,
  entityType: true,
  targetParentId: true,
  targetId: true,
  targetType: true,
  action: true,
  access: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);
export const permissionItemListExtractor = makeListExtract(permissionItemFields);

export function throwPermissionItemNotFound() {
  throw reuseableErrors.permissionItem.notFound();
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
  appAssert(
    targetType,
    new InvalidRequestError('Target ID or target type must be present')
  );
  return targetType;
}

export function assertPermissionItem(item?: PermissionItem | null): asserts item {
  appAssert(item, reuseableErrors.permissionItem.notFound());
}

export async function getPermissionItemEntities(
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string,
  entityIds: string | string[]
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
    inputResources: toArray(entityIds).map(entityId => ({resourceId: entityId})),
    checkAuth: true,
    checkBelongsToWorkspace: true,
    action: 'updatePermission',
  });
  resources = await resourceListWithAssignedItems(context, workspaceId, resources, [
    AppResourceType.User,
  ]);
  checkResourcesBelongsToWorkspace(workspaceId, resources);
  return resources;
}

export async function getPermissionItemTargets(
  context: BaseContextType,
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
    action: 'updatePermission',
  });
}
