import {IAssignedItem, IAssignedItemMainFieldsMatcher} from '../../definitions/assignedItem';
import {IAssignedPermissionGroupMeta} from '../../definitions/permissionGroups';
import {IAssignedTag} from '../../definitions/tag';
import {IUserWorkspace} from '../../definitions/user';
import {makeKey} from '../../utils/fns';
import {NotFoundError} from '../errors';

export function assignedItemToAssignedPermissionGroup(
  item: IAssignedItem
): IAssignedPermissionGroupMeta {
  return {
    permissionGroupId: item.assignedItemId,
    assignedAt: item.createdAt,
    assignedBy: item.createdBy,
    assignedToEntityId: item.assignedToItemId,
  };
}

export function assignedItemsToAssignedPermissionGroupList(
  items: IAssignedItem[]
): IAssignedPermissionGroupMeta[] {
  return items.map(assignedItemToAssignedPermissionGroup);
}

export function assignedItemToAssignedTag(item: IAssignedItem): IAssignedTag {
  return {
    tagId: item.assignedItemId,
    assignedAt: item.createdAt,
    assignedBy: item.createdBy,
  };
}

export function assignedItemsToAssignedTagList(items: IAssignedItem[]): IAssignedTag[] {
  return items.map(assignedItemToAssignedTag);
}

export function assignedItemToAssignedWorkspace(item: IAssignedItem): IUserWorkspace {
  return {
    workspaceId: item.assignedItemId,
    joinedAt: item.createdAt,
  };
}

export function assignedItemsToAssignedWorkspaceList(items: IAssignedItem[]): IUserWorkspace[] {
  return items.map(item => assignedItemToAssignedWorkspace(item));
}

export function throwAssignedItemNotFound() {
  throw new NotFoundError('Assigned item not found');
}

export function assignedItemIndexer(item: IAssignedItemMainFieldsMatcher) {
  return makeKey([item.workspaceId, item.assignedItemId, item.assignedToItemId]);
}
