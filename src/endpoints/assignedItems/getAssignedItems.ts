import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  ResourceWithPresetsAndTags,
} from '../../definitions/assignedItem';
import {AppResourceType, IResourceBase} from '../../definitions/system';
import {IUser, IUserWorkspace} from '../../definitions/user';
import {IBaseContext} from '../contexts/BaseContext';
import AssignedItemQueries from './queries';
import {
  assignedItemsToAssignedWorkspaceList,
  assignedItemsToAssignedPresetList,
  assignedItemsToAssignedTagList,
} from './utils';

export async function getResourceAssignedItems(
  context: IBaseContext,

  // Use empty string for fetching user workspaces
  workspaceId: string,
  resourceId: string,
  resourceType: AppResourceType
) {
  return await context.data.assignedItem.getManyItems(
    AssignedItemQueries.getByAssignedToResource(
      workspaceId,
      resourceId,
      resourceType
    )
  );
}

export async function getAssignableItemAssignedItems(
  context: IBaseContext,
  workspaceId: string,
  assignedItemId: string,
  assignedItemType: AppResourceType
) {
  return await context.data.assignedItem.getManyItems(
    AssignedItemQueries.getByAssignedItem(
      workspaceId,
      assignedItemId,
      assignedItemType
    )
  );
}

export async function getResourceAssignedItemsSorted(
  context: IBaseContext,

  // Use empty string for fetching user workspaces
  workspaceId: string,
  resourceId: string,
  resourceType: AppResourceType
) {
  const items = await getResourceAssignedItems(
    context,
    workspaceId,
    resourceId,
    resourceType
  );

  const sortedItems: Record<string, IAssignedItem[]> = {};
  items.forEach(item => {
    const typeItems = defaultTo(sortedItems[item.assignedItemType], []);
    typeItems.push(item);
    sortedItems[item.assignedItemType] = typeItems;
  });

  return sortedItems;
}

export async function withAssignedPresetsAndTags<T extends IResourceBase>(
  context: IBaseContext,
  workspaceId: string,
  resource: T,
  resourceType: AppResourceType
): Promise<ResourceWithPresetsAndTags<T>> {
  const sortedItems = await getResourceAssignedItemsSorted(
    context,
    workspaceId,
    resource.resourceId,
    resourceType
  );

  const updatedResource: ResourceWithPresetsAndTags<T> =
    resource as ResourceWithPresetsAndTags<T>;
  updatedResource.presets = [];
  updatedResource.tags = [];

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PresetPermissionsGroup:
        updatedResource.presets = assignedItemsToAssignedPresetList(
          sortedItems[type]
        );
        break;

      case AppResourceType.Tag:
        updatedResource.tags = assignedItemsToAssignedTagList(
          sortedItems[type]
        );
        break;
    }
  }

  return updatedResource;
}

export async function resourceListWithAssignedPresetsAndTags<
  T extends IResourceBase
>(
  context: IBaseContext,
  workspaceId: string,
  resources: T[],
  type: AppResourceType
) {
  return await Promise.all(
    resources.map(resource =>
      withAssignedPresetsAndTags(context, workspaceId, resource, type)
    )
  );
}

export async function withUserWorkspaces<T extends IUser>(
  context: IBaseContext,
  resource: T
): Promise<T & {workspaces: IUserWorkspace[]}> {
  const sortedItems = await getResourceAssignedItemsSorted(
    context,
    '', // Empty string is used to fetch user workspaces
    resource.resourceId,
    AppResourceType.User
  );

  const updatedResource: T & {workspaces: IUserWorkspace[]} = resource as T & {
    workspaces: IUserWorkspace[];
  };
  let assignedPresetItems: IAssignedItem[] = [];
  let assignedWorkspaceItems: IAssignedItem[] = [];

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PresetPermissionsGroup:
        assignedPresetItems = sortedItems[type];
        break;

      case AppResourceType.Tag:
        assignedWorkspaceItems = sortedItems[type];
        break;
    }
  }

  const assignedPresetsMap: Record<string, IAssignedItem[]> =
    assignedPresetItems.reduce((map, item) => {
      const workspacePresetItems = defaultTo(map[item.workspaceId], []);
      workspacePresetItems.push(item);
      map[item.workspaceId] = workspacePresetItems;
      return map;
    }, {} as Record<string, IAssignedItem[]>);

  updatedResource.workspaces = assignedItemsToAssignedWorkspaceList(
    assignedWorkspaceItems,
    assignedPresetsMap
  );

  return updatedResource;
}

export async function userListWithWorkspaces<T extends IUser>(
  context: IBaseContext,
  resources: T[]
) {
  return await Promise.all(
    resources.map(resource => withUserWorkspaces(context, resource))
  );
}
