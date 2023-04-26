import {isArray} from 'lodash';
import {AssignedItem} from '../../definitions/assignedItem';
import {AssignPermissionGroupInput} from '../../definitions/permissionGroups';
import {Agent, AppActionType, AppResourceType} from '../../definitions/system';
import {AssignedTagInput} from '../../definitions/tag';
import {Workspace} from '../../definitions/workspace';
import {makeKey} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {
  getNewIdForResource,
  getResourceTypeFromId,
  newWorkspaceResource,
} from '../../utils/resource';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderMutationRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
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
async function filterExistingItems<T extends AssignedItem>(
  context: BaseContextType,
  workspaceId: string,
  items: T[],
  comparatorFn?: (item01: T, item02: AssignedItem) => boolean
) {
  const assigneeIdList: string[] = [];
  const assignedItemIdList: string[] = [];
  items.forEach(item => {
    assigneeIdList.push(item.assigneeId);
    assignedItemIdList.push(item.assignedItemId);
  });
  const existingItems = await context.semantic.assignedItem.getByWorkspaceAssignedAndAssigneeIds(
    workspaceId,
    assignedItemIdList,
    assigneeIdList
  );
  const indexer = (item: Pick<AssignedItem, 'assignedItemId' | 'assigneeId'>) =>
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

/**
 *
 * @param context
 * @param workspaceId
 * @param items
 * @param deletedExistingItems - No need to delete existing items
 * @param comparatorFn
 * @param opts
 * @returns
 */
export async function addAssignedItems<T extends AssignedItem>(
  context: BaseContextType,
  workspaceId: string,
  items: T[],
  deletedExistingItems: boolean,
  comparatorFn: ((item01: T, item02: AssignedItem) => boolean) | undefined,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  if (deletedExistingItems) {
    await context.semantic.assignedItem.insertItem(items, opts);
    return items;
  } else {
    const {itemIdListToDelete, resolvedItems} = await filterExistingItems(
      context,
      workspaceId,
      items,
      comparatorFn
    );
    await Promise.all([
      context.semantic.assignedItem.insertItem(resolvedItems, opts),
      itemIdListToDelete &&
        context.semantic.assignedItem.deleteManyByIdList(itemIdListToDelete, opts),
    ]);
    return resolvedItems;
  }
}

export async function addAssignedPermissionGroupList(
  context: BaseContextType,
  agent: Agent,
  workspaceId: string,
  permissionGroupsInput: AssignPermissionGroupInput[],
  assigneeId: string | string[],
  deleteExisting: boolean,
  skipPermissionGroupsExistCheck = false,
  skipAuthCheck = false,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(
      context,
      workspaceId,
      assigneeId,
      [AppResourceType.PermissionGroup],
      opts
    );
  }

  if (!skipPermissionGroupsExistCheck) {
    await checkPermissionGroupsExist(context, workspaceId, permissionGroupsInput, opts);
  }

  if (!skipAuthCheck) {
    await checkAuthorization({
      context,
      agent,
      workspaceId: workspaceId,
      action: AppActionType.GrantPermission,
      targets: {targetType: AppResourceType.PermissionGroup},
    });
  }

  const idList = isArray(assigneeId) ? assigneeId : [assigneeId];
  const items: Array<AssignedItem> = [];

  for (const input of permissionGroupsInput) {
    for (const id of idList) {
      const item = withAssignedAgent(
        agent,
        newWorkspaceResource<AssignedItem>(agent, AppResourceType.AssignedItem, workspaceId, {
          meta: {},
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

  const comparatorFn = (item01: AssignedItem, item02: AssignedItem) => {
    // Delete existing assigned permission groups and re-assign it if the order
    // is changed.
    return item01.meta.order !== (item02 as AssignedItem).meta.order;
  };

  return await addAssignedItems(context, workspaceId, items, deleteExisting, comparatorFn, opts);
}

export async function addAssignedTagList(
  context: BaseContextType,
  agent: Agent,
  workspace: Workspace,
  tags: AssignedTagInput[],
  assigneeId: string,
  deleteExisting: boolean,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(
      context,
      workspace.resourceId,
      assigneeId,
      [AppResourceType.Tag],
      opts
    );
  }

  // TODO: This logic is wrong, try creating tags that don't exist, then assign
  // them if not yet assigned.
  const items = tags.map(tag => {
    return withAssignedAgent(
      agent,
      newWorkspaceResource<AssignedItem>(
        agent,
        AppResourceType.AssignedItem,
        workspace.resourceId,
        {
          assigneeId,
          assigneeType: getResourceTypeFromId(assigneeId),
          meta: {},
          resourceId: getNewIdForResource(AppResourceType.AssignedItem),
          assignedItemId: tag.tagId,
          assignedItemType: AppResourceType.PermissionGroup,
        }
      )
    );
  });
  await Promise.all([
    checkTagsExist(context, agent, workspace, tags, AppActionType.Read),
    addAssignedItems(context, workspace.resourceId, items, deleteExisting, undefined, opts),
  ]);

  return items;
}

export interface ISaveResourceAssignedItemsOptions {
  skipPermissionGroupsExistCheck?: boolean;
}

export async function saveResourceAssignedItems(
  context: BaseContextType,
  agent: Agent,
  workspace: Workspace,

  // TODO: support ID list
  resourceId: string,
  data: {tags?: AssignedTagInput[]},

  // TODO: deleteExisting should be false by default and add checks to avoid
  // duplication
  deleteExisting = true,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  if (data.tags) {
    await addAssignedTagList(
      context,
      agent,
      workspace,
      data.tags,
      resourceId,
      deleteExisting,
      opts
    );
  }
}

export async function assignWorkspaceToUser(
  context: BaseContextType,
  agent: Agent,
  workspaceId: string,
  userId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const items: AssignedItem[] = [
    withAssignedAgent(
      agent,
      newWorkspaceResource(agent, AppResourceType.AssignedItem, workspaceId, {
        assigneeId: userId,
        assigneeType: AppResourceType.User,
        meta: {},
        resourceId: getNewIdForResource(AppResourceType.AssignedItem),
        assignedItemId: workspaceId,
        assignedItemType: AppResourceType.Workspace,
      })
    ),
  ];
  return await context.semantic.assignedItem.insertItem(items, opts);
}
