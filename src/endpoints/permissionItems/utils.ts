import {PermissionItem, PublicPermissionItem} from '../../definitions/permissionItem';
import {
  AppResourceType,
  SessionAgent,
  getWorkspaceResourceTypeList,
  kAppResourceType,
} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {toArray} from '../../utils/fns';
import {getResourceTypeFromId} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {InvalidRequestError} from '../errors';
import {workspaceResourceFields} from '../extractors';
import {checkResourcesBelongsToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';
import {resourceListWithAssignedItems} from '../resources/resourceWithAssignedItems';
import {FetchResourceItem} from '../resources/types';

import {PermissionItemInputTarget} from './types';

const permissionItemFields = getFields<PublicPermissionItem>({
  ...workspaceResourceFields,
  entityId: true,
  entityType: true,
  targetId: true,
  targetType: true,
  action: true,
  access: true,
});

export const permissionItemExtractor = makeExtract(permissionItemFields);
export const permissionItemListExtractor = makeListExtract(permissionItemFields);

export function throwPermissionItemNotFound() {
  throw kReuseableErrors.permissionItem.notFound();
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
  appAssert(item, kReuseableErrors.permissionItem.notFound());
}

export async function getPermissionItemEntities(
  agent: SessionAgent,
  workspaceId: string,
  entityIds: string | string[]
) {
  let resources = await INTERNAL_getResources({
    agent,
    allowedTypes: [
      kAppResourceType.User,
      kAppResourceType.PermissionGroup,
      kAppResourceType.AgentToken,
    ],
    workspaceId,
    inputResources: toArray(entityIds).map(entityId => ({
      resourceId: entityId,
      action: 'updatePermission',
    })),
    checkAuth: true,
    checkBelongsToWorkspace: true,
  });
  resources = await resourceListWithAssignedItems(workspaceId, resources, [
    kAppResourceType.User,
  ]);
  checkResourcesBelongsToWorkspace(workspaceId, resources);
  return resources;
}

export async function getPermissionItemTargets(
  agent: SessionAgent,
  workspace: Workspace,
  target: Partial<PermissionItemInputTarget> | Partial<PermissionItemInputTarget>[]
) {
  return await INTERNAL_getResources({
    agent,
    workspaceId: workspace.resourceId,
    allowedTypes: getWorkspaceResourceTypeList(),
    inputResources: toArray(target).map((nextTarget): FetchResourceItem => {
      return {
        resourceId: nextTarget.targetId,
        filepath: nextTarget.filepath,
        folderpath: nextTarget.folderpath,
        workspaceRootname: nextTarget.workspaceRootname,
        action: 'updatePermission',
      };
    }),
    checkAuth: true,
    checkBelongsToWorkspace: true,
  });
}
