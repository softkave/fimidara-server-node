import {isArray} from 'lodash';
import {AssignedItem} from '../../definitions/assignedItem';
import {AssignPermissionGroupInput} from '../../definitions/permissionGroups';
import {Agent, kFimidaraResourceType} from '../../definitions/system';
import {AssignedTagInput} from '../../definitions/tag';
import {Workspace} from '../../definitions/workspace';
import {makeKey} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {
  getNewIdForResource,
  getResourceTypeFromId,
  newWorkspaceResource,
} from '../../utils/resource';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../contexts/semantic/types';
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
  workspaceId: string,
  items: T[],
  comparatorFn?: (item01: T, item02: AssignedItem) => boolean,
  opts?: SemanticProviderQueryListParams<T>
) {
  const assigneeIdList: string[] = [];
  const assignedItemIdList: string[] = [];
  items.forEach(item => {
    assigneeIdList.push(item.assigneeId);
    assignedItemIdList.push(item.assignedItemId);
  });
  const existingItems = await kSemanticModels
    .assignedItem()
    .getByWorkspaceAssignedAndAssigneeIds(
      workspaceId,
      assignedItemIdList,
      assigneeIdList,
      opts
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

export async function addAssignedItems<T extends AssignedItem>(
  workspaceId: string,
  items: T[],
  /** No need to delete existing items */ deletedExistingItems: boolean,
  comparatorFn: ((item01: T, item02: AssignedItem) => boolean) | undefined,
  opts: SemanticProviderMutationParams
) {
  if (deletedExistingItems) {
    await kSemanticModels.assignedItem().insertItem(items, opts);
    return items;
  } else {
    const {itemIdListToDelete, resolvedItems} = await filterExistingItems(
      workspaceId,
      items,
      comparatorFn,
      opts
    );
    await Promise.all([
      kSemanticModels.assignedItem().insertItem(resolvedItems, opts),
      itemIdListToDelete &&
        kSemanticModels.assignedItem().deleteManyByIdList(itemIdListToDelete, opts),
    ]);
    return resolvedItems;
  }
}

export async function addAssignedPermissionGroupList(
  agent: Agent,
  workspaceId: string,
  permissionGroupsInput: AssignPermissionGroupInput[],
  assigneeId: string | string[],
  deleteExisting: boolean,
  skipPermissionGroupsExistCheck = false,
  skipAuthCheck = false,
  opts: SemanticProviderMutationParams
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(
      workspaceId,
      assigneeId,
      [kFimidaraResourceType.PermissionGroup],
      opts
    );
  }

  if (!skipPermissionGroupsExistCheck) {
    await checkPermissionGroupsExist(workspaceId, permissionGroupsInput, opts);
  }

  if (!skipAuthCheck) {
    await checkAuthorizationWithAgent({
      agent,
      opts,
      workspaceId: workspaceId,
      target: {targetId: workspaceId, action: 'updatePermission'},
    });
  }

  const idList = isArray(assigneeId) ? assigneeId : [assigneeId];
  const items: Array<AssignedItem> = [];

  for (const input of permissionGroupsInput) {
    for (const id of idList) {
      const item = withAssignedAgent(
        agent,
        newWorkspaceResource<AssignedItem>(
          agent,
          kFimidaraResourceType.AssignedItem,
          workspaceId,
          {
            meta: {},
            assigneeId: id,
            assigneeType: getResourceTypeFromId(id),
            resourceId: getNewIdForResource(kFimidaraResourceType.AssignedItem),
            assignedItemId: input.permissionGroupId,
            assignedItemType: kFimidaraResourceType.PermissionGroup,
          }
        )
      );
      items.push(item);
    }
  }

  const comparatorFn = (item01: AssignedItem, item02: AssignedItem) => {
    // Delete existing assigned permission groups and re-assign it if the order
    // is changed.
    return item01.meta.order !== (item02 as AssignedItem).meta.order;
  };

  return await addAssignedItems(workspaceId, items, deleteExisting, comparatorFn, opts);
}

export async function addAssignedTagList(
  agent: Agent,
  workspace: Workspace,
  tags: AssignedTagInput[],
  assigneeId: string,
  deleteExisting: boolean,
  opts: SemanticProviderMutationParams
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(
      workspace.resourceId,
      assigneeId,
      [kFimidaraResourceType.Tag],
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
        kFimidaraResourceType.AssignedItem,
        workspace.resourceId,
        {
          assigneeId,
          assigneeType: getResourceTypeFromId(assigneeId),
          meta: {},
          resourceId: getNewIdForResource(kFimidaraResourceType.AssignedItem),
          assignedItemId: tag.tagId,
          assignedItemType: kFimidaraResourceType.PermissionGroup,
        }
      )
    );
  });
  await Promise.all([
    checkTagsExist(agent, workspace, tags, 'readTag'),
    addAssignedItems(workspace.resourceId, items, deleteExisting, undefined, opts),
  ]);

  return items;
}

export interface ISaveResourceAssignedItemsOptions {
  skipPermissionGroupsExistCheck?: boolean;
}

export async function saveResourceAssignedItems(
  agent: Agent,
  workspace: Workspace,

  // TODO: support ID list
  resourceId: string,
  data: {tags?: AssignedTagInput[]},

  // TODO: deleteExisting should be false by default and add checks to avoid
  // duplication
  deleteExisting = true,
  opts: SemanticProviderMutationParams
) {
  if (data.tags) {
    await addAssignedTagList(
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
  agent: Agent,
  workspaceId: string,
  userId: string,
  opts: SemanticProviderMutationParams
) {
  const items: AssignedItem[] = [
    withAssignedAgent(
      agent,
      newWorkspaceResource(agent, kFimidaraResourceType.AssignedItem, workspaceId, {
        assigneeId: userId,
        assigneeType: kFimidaraResourceType.User,
        meta: {},
        resourceId: getNewIdForResource(kFimidaraResourceType.AssignedItem),
        assignedItemId: workspaceId,
        assignedItemType: kFimidaraResourceType.Workspace,
      })
    ),
  ];

  return await kSemanticModels.assignedItem().insertItem(items, opts);
}
