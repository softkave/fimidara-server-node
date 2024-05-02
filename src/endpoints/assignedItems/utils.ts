import {
  AssignedItem,
  AssignedItemMainFieldsMatcher,
} from '../../definitions/assignedItem.js';
import {AssignedPermissionGroupMeta} from '../../definitions/permissionGroups.js';
import {WorkspaceResource} from '../../definitions/system.js';
import {AssignedTag} from '../../definitions/tag.js';
import {makeKey} from '../../utils/fns.js';
import {NotFoundError} from '../errors.js';

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

export function assignedItemToAssignedWorkspace(item: AssignedItem): WorkspaceResource {
  return {
    workspaceId: item.assignedItemId,
    resourceId: item.assigneeId,
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    lastUpdatedAt: item.lastUpdatedAt,
    lastUpdatedBy: item.lastUpdatedBy,
    deletedAt: item.deletedAt,
    deletedBy: item.deletedBy,
    isDeleted: item.isDeleted,
  };
}

export function assignedItemsToAssignedWorkspaceList(
  items: AssignedItem[]
): WorkspaceResource[] {
  return items.map(item => assignedItemToAssignedWorkspace(item));
}

export function throwAssignedItemNotFound() {
  throw new NotFoundError('Assigned item not found');
}

export function assignedItemIndexer(item: AssignedItemMainFieldsMatcher) {
  return makeKey([item.workspaceId, item.assignedItemId, item.assigneeId]);
}
