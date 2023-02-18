import {compact, flatten, isArray} from 'lodash';
import {
  IAssignedItem,
  IAssignedItemAssignedPermissionGroupMeta,
  IAssignedItemMainFieldsMatcher,
} from '../../definitions/assignedItem';
import {IAssignPermissionGroupInput} from '../../definitions/permissionGroups';
import {AppResourceType, IAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import {IWorkspace} from '../../definitions/workspace';
import {indexArray} from '../../utils/indexArray';
import {getNewIdForResource, getResourceTypeFromId} from '../../utils/resourceId';
import {IBaseContext} from '../contexts/types';
import {checkPermissionGroupsExist} from '../permissionGroups/utils';
import checkTagsExist from '../tags/checkTagsExist';
import {IResourceWithoutAssignedAgent, withAssignedAgent} from '../utils';
import {deleteResourceAssignedItems} from './deleteAssignedItems';
import AssignedItemQueries from './queries';
import {assignedItemIndexer} from './utils';

async function getNonExistingAssignedItems<T extends IAssignedItemMainFieldsMatcher>(
  context: IBaseContext,
  items: T[]
): Promise<T[]> {
  const fetchedItems = await Promise.all(
    items.map(item =>
      context.data.assignedItem.getOneByQuery(AssignedItemQueries.getByMainFields(item))
    )
  );

  const itemsMap = indexArray(compact(fetchedItems), {
    indexer: assignedItemIndexer,
  });

  return items.filter(item => !itemsMap[assignedItemIndexer(item)]);
}

export async function addAssignedItemList(context: IBaseContext, items: IAssignedItem[]) {
  const nonExistingItems = await getNonExistingAssignedItems(context, items);
  await context.data.assignedItem.insertList(nonExistingItems);
  return items;
}

export async function addAssignedPermissionGroupList(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  permissionGroups: IAssignPermissionGroupInput[],
  assignedToItemId: string | string[],
  deleteExisting: boolean,
  skipPermissionGroupsExistCheck = false
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(context, workspace.resourceId, assignedToItemId, [
      AppResourceType.PermissionGroup,
    ]);
  }

  if (!skipPermissionGroupsExistCheck) {
    await checkPermissionGroupsExist(context, agent, workspace, permissionGroups);
  }

  const items = permissionGroups.map(permissionGroup => {
    const meta: IAssignedItemAssignedPermissionGroupMeta = {
      order: permissionGroup.order ?? Number.MAX_SAFE_INTEGER,
    };
    const idList = isArray(assignedToItemId) ? assignedToItemId : [assignedToItemId];
    return idList.map(id => {
      const baseItem: IResourceWithoutAssignedAgent<IAssignedItem> = {
        meta,
        assignedToItemId: id,
        assignedToItemType: getResourceTypeFromId(id),
        resourceId: getNewIdForResource(AppResourceType.AssignedItem),
        assignedItemId: permissionGroup.permissionGroupId,
        assignedItemType: AppResourceType.PermissionGroup,
        workspaceId: workspace.resourceId,
      };
      return withAssignedAgent(agent, baseItem);
    });
  });

  return await addAssignedItemList(context, flatten(items));
}

export async function addAssignedTagList(
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  tags: IAssignedTagInput[],
  assignedToItemId: string,
  deleteExisting: boolean
) {
  if (deleteExisting) {
    await deleteResourceAssignedItems(context, workspace.resourceId, assignedToItemId, [
      AppResourceType.Tag,
    ]);
  }

  await checkTagsExist(context, agent, workspace, tags);
  const items = tags.map(tag => {
    const baseItem: IResourceWithoutAssignedAgent<IAssignedItem> = {
      assignedToItemId,
      assignedToItemType: getResourceTypeFromId(assignedToItemId),
      meta: {},
      resourceId: getNewIdForResource(AppResourceType.AssignedItem),
      assignedItemId: tag.tagId,
      assignedItemType: AppResourceType.PermissionGroup,
      workspaceId: workspace.resourceId,
    };

    return withAssignedAgent(agent, baseItem);
  });

  return await addAssignedItemList(context, items);
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
    permissionGroups?: IAssignPermissionGroupInput[];
  },

  // TODO: deleteExisting should be false by default and add checks to avoid
  // duplication
  deleteExisting = true,
  options: ISaveResourceAssignedItemsOptions = {}
) {
  if (data.permissionGroups) {
    await addAssignedPermissionGroupList(
      context,
      agent,
      workspace,
      data.permissionGroups,
      resourceId,
      deleteExisting,
      options.skipPermissionGroupsExistCheck
    );
  }

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
  const baseItem: IResourceWithoutAssignedAgent<IAssignedItem> = {
    workspaceId,
    assignedToItemId: user.resourceId,
    assignedToItemType: AppResourceType.User,
    meta: {},
    resourceId: getNewIdForResource(AppResourceType.AssignedItem),
    assignedItemId: workspaceId,
    assignedItemType: AppResourceType.Workspace,
  };

  const items: IAssignedItem[] = [withAssignedAgent(agent, baseItem)];
  return await addAssignedItemList(context, items);
}
