import {AssignedItem, AssignedItemMainFieldsMatcher} from '../../definitions/assignedItem';
import {AssignedPermissionGroupMeta} from '../../definitions/permissionGroups';
import {AssignedTag} from '../../definitions/tag';
import {UserWorkspace} from '../../definitions/user';
import {makeKey} from '../../utils/fns';
import {NotFoundError} from '../errors';

export function assignedItemToAssignedPermissionGroup(
  item: AssignedItem
): AssignedPermissionGroupMeta {
  return {
    permissionGroupId: item.assignedItemId,
    assignedAt: item.createdAt,
    assignedBy: item.createdBy,
    assigneeEntityId: item.assigneeId,
  };
}

export function assignedItemsToAssignedPermissionGroupList(
  items: AssignedItem[]
): AssignedPermissionGroupMeta[] {
  return items.map(assignedItemToAssignedPermissionGroup);
}

export function assignedItemToAssignedTag(item: AssignedItem): AssignedTag {
  return {
    tagId: item.assignedItemId,
    assignedAt: item.createdAt,
    assignedBy: item.createdBy,
  };
}

export function assignedItemsToAssignedTagList(items: AssignedItem[]): AssignedTag[] {
  return items.map(assignedItemToAssignedTag);
}

export function assignedItemToAssignedWorkspace(item: AssignedItem): UserWorkspace {
  return {
    workspaceId: item.assignedItemId,
    joinedAt: item.createdAt,
  };
}

export function assignedItemsToAssignedWorkspaceList(items: AssignedItem[]): UserWorkspace[] {
  return items.map(item => assignedItemToAssignedWorkspace(item));
}

export function throwAssignedItemNotFound() {
  throw new NotFoundError('Assigned item not found');
}

export function assignedItemIndexer(item: AssignedItemMainFieldsMatcher) {
  return makeKey([item.workspaceId, item.assignedItemId, item.assigneeId]);
}
