import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  IAssignedItemMainFieldsMatcher,
  IAssignedPermissionGroupMeta,
} from '../../definitions/assignedItem';
import {IAssignedPermissionGroup} from '../../definitions/permissionGroups';
import {IAssignedTag} from '../../definitions/tag';
import {IUserWorkspace} from '../../definitions/user';
import {makeKey} from '../../utilities/fns';
import {NotFoundError} from '../errors';

export function assignedItemToAssignedPermissionGroup(
  item: IAssignedItem
): IAssignedPermissionGroup {
  return {
    permissionGroupId: item.assignedItemId,
    assignedAt: item.assignedAt,
    assignedBy: item.assignedBy,
    order: (item.meta as IAssignedPermissionGroupMeta).order,
  };
}

export function assignedItemsToAssignedPermissionGroupList(
  items: IAssignedItem[]
): IAssignedPermissionGroup[] {
  return (
    items
      // .filter(
      //   item => item.assignedItemType === AppResourceType.PermissionGroup
      // )
      .map(assignedItemToAssignedPermissionGroup)
  );
}

export function assignedItemToAssignedTag(item: IAssignedItem): IAssignedTag {
  return {
    tagId: item.assignedItemId,
    assignedAt: item.assignedAt,
    assignedBy: item.assignedBy,
  };
}

export function assignedItemsToAssignedTagList(
  items: IAssignedItem[]
): IAssignedTag[] {
  return (
    items
      // .filter(item => item.assignedItemType === AppResourceType.Tag)
      .map(assignedItemToAssignedTag)
  );
}

export function assignedItemToAssignedWorkspace(
  item: IAssignedItem,
  permissionGroupItems: IAssignedItem[]
): IUserWorkspace {
  return {
    workspaceId: item.assignedItemId,
    joinedAt: item.assignedAt,
    permissionGroups:
      assignedItemsToAssignedPermissionGroupList(permissionGroupItems),
  };
}

export function assignedItemsToAssignedWorkspaceList(
  items: IAssignedItem[],
  itemsPermissionGroupMap: Record<string, IAssignedItem[]>
): IUserWorkspace[] {
  return (
    items
      // .filter(item => item.assignedItemType === AppResourceType.Workspace)
      .map(item =>
        assignedItemToAssignedWorkspace(
          item,
          defaultTo(itemsPermissionGroupMap[item.assignedItemId], [])
        )
      )
  );
}

export function throwAssignedItemNotFound() {
  throw new NotFoundError('Assigned item not found');
}

export function assignedItemIndexer(item: IAssignedItemMainFieldsMatcher) {
  return makeKey([
    item.workspaceId,
    item.assignedItemId,
    item.assignedItemType,
    item.assignedToItemId,
    item.assignedToItemType,
  ]);
}
