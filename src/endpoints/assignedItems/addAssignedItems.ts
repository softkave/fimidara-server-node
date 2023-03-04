import {isArray} from 'lodash';
import {IAssignedItem} from '../../definitions/assignedItem';
import {IAssignPermissionGroupInput} from '../../definitions/permissionGroups';
import {AppResourceType, IAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import {IWorkspace} from '../../definitions/workspace';
import {makeKey, newResource} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {getNewIdForResource, getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {checkPermissionGroupsExist} from '../permissionGroups/utils';
import checkTagsExist from '../tags/checkTagsExist';
import {withAssignedAgent} from '../utils';
import {deleteResourceAssignedItems} from './deleteAssignedItems';

/**
 * @param context
 * @param workspaceId
 * @param items
 * @param comparatorFn - Return `true` to delete existing item and include new
 * item, and `false` to not include item.
 */
async function filterExistingItems<T extends IAssignedItem>(
  context: IBaseContext,
  workspaceId: string,
  items: T[],
  comparatorFn?: (item01: T, item02: IAssignedItem) => boolean
) {
  const assigneeIdList: string[] = [];
  const assignedItemIdList: string[] = [];
  items.forEach(item => {
    assigneeIdList.push(item.assigneeId);
    assignedItemIdList.push(item.assignedItemId);
  });
  const existingItems = await context.semantic.assignedItem.getByAssignedAndAssigneeIds(
    assignedItemIdList,
    assigneeIdList
  );
  const indexer = (item: Pick<IAssignedItem, 'assignedItemId' | 'assigneeId'>) =>
    makeKey([item.assignedItemId, item.assigneeId]);
  const existingItemsMap = indexArray(existingItems, {indexer});
  const itemIdListToDelete: string[] = [];
  const resolvedItems: T[] = [];

  items.forEach(item => {
    const existingItem = existingItemsMap[indexer(item)];
    if (existingItem) {
      if (comparatorFn && comparatorFn(item, existingItem)) {
        itemIdListToDelete.push(existingItem.resourceId);
        resolvedItems.push(item);
      }
    } else {
      resolvedItems.push(item);
    }
  });

  return {itemIdListToDelete, resolvedItems};
}

export async function addAssignedItems<T extends IAssignedItem>(
  context: IBaseContext,
  workspaceId: string,
  items: T[],
  deletedExisting: boolean,
  comparatorFn?: (item01: T, item02: IAssignedItem) => boolean
) {
  if (deletedExisting) {
    await context.semantic.assignedItem.insertList(items);
    return items;
  } else {
    const {itemIdListToDelete, resolvedItems} = await filterExistingItems(
      context,
      workspaceId,
      items,
      comparatorFn
    );
    await Promise.all([
      context.semantic.assignedItem.insertList(resolvedItems),
      itemIdListToDelete && context.semantic.assignedItem.deleteManyByIdList(itemIdListToDelete),
    ]);
    return resolvedItems;
  }
}

export async function addAssignedPermissionGroupList(
  context: IBaseContext,
  agent: IAgent,
  workspaceId: string,
  permissionGroupsInput: IAssignPermissionGroupInput[],
  assigneeId: string | string[],
  deleteExisting: boolean,
  skipPermissionGroupsExistCheck = false
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(context, assigneeId, [AppResourceType.PermissionGroup]);
  }
  if (!skipPermissionGroupsExistCheck) {
    await checkPermissionGroupsExist(context, agent, workspaceId, permissionGroupsInput);
  }

  const idList = isArray(assigneeId) ? assigneeId : [assigneeId];
  const items: Array<IAssignedItem> = [];

  for (const input of permissionGroupsInput) {
    for (const id of idList) {
      const item = withAssignedAgent(
        agent,
        newResource(agent, AppResourceType.AssignedItem, {
          meta: {},
          workspaceId,
          assigneeId: id,
          assigneeType: getResourceTypeFromId(id),
          resourceId: getNewIdForResource(AppResourceType.AssignedItem),
          assignedItemId: input.permissionGroupId,
          assignedItemType: AppResourceType.PermissionGroup,
        })
      );
      items.push(item);
    }
  }

  const comparatorFn = (item01: IAssignedItem, item02: IAssignedItem) => {
    // Delete existing assigned permission groups and re-assign it if the order
    // is changed.
    return item01.meta.order !== (item02 as IAssignedItem).meta.order;
  };

  return await addAssignedItems(context, workspaceId, items, deleteExisting, comparatorFn);
}

export async function addAssignedTagList(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  tags: IAssignedTagInput[],
  assigneeId: string,
  deleteExisting: boolean
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(context, assigneeId, [AppResourceType.Tag]);
  }

  await checkTagsExist(context, agent, workspace, tags);
  const items = tags.map(tag => {
    return withAssignedAgent(
      agent,
      newResource(agent, AppResourceType.AssignedItem, {
        assigneeId,
        assigneeType: getResourceTypeFromId(assigneeId),
        meta: {},
        resourceId: getNewIdForResource(AppResourceType.AssignedItem),
        assignedItemId: tag.tagId,
        assignedItemType: AppResourceType.PermissionGroup,
        workspaceId: workspace.resourceId,
      })
    );
  });

  return await addAssignedItems(context, workspace.resourceId, items, deleteExisting);
}

export interface ISaveResourceAssignedItemsOptions {
  skipPermissionGroupsExistCheck?: boolean;
}

export async function saveResourceAssignedItems(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,

  // TODO: support ID list
  resourceId: string,
  data: {
    tags?: IAssignedTagInput[];
  },

  // TODO: deleteExisting should be false by default and add checks to avoid
  // duplication
  deleteExisting = true
) {
  if (data.tags) {
    await addAssignedTagList(context, agent, workspace, data.tags, resourceId, deleteExisting);
  }
}

export async function assignWorkspaceToUser(
  context: IBaseContext,
  agent: IAgent,
  workspaceId: string,
  user: IUser
) {
  const items: IAssignedItem[] = [
    withAssignedAgent(
      agent,
      newResource(agent, AppResourceType.AssignedItem, {
        workspaceId,
        assigneeId: user.resourceId,
        assigneeType: AppResourceType.User,
        meta: {},
        resourceId: getNewIdForResource(AppResourceType.AssignedItem),
        assignedItemId: workspaceId,
        assignedItemType: AppResourceType.Workspace,
      })
    ),
  ];
  return await context.semantic.assignedItem.insertList(items);
}
