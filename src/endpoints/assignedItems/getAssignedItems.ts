import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  ResourceWithPermissionGroupsAndTags,
} from '../../definitions/assignedItem';
import {AppResourceType, IResourceBase} from '../../definitions/system';
import {IUser, IUserWorkspace} from '../../definitions/user';
import {IBaseContext} from '../contexts/BaseContext';
import AssignedItemQueries from './queries';
import {
  assignedItemsToAssignedPermissionGroupList,
  assignedItemsToAssignedTagList,
  assignedItemsToAssignedWorkspaceList,
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

export async function withAssignedPermissionGroupsAndTags<
  T extends IResourceBase
>(
  context: IBaseContext,
  workspaceId: string,
  resource: T,
  resourceType: AppResourceType
): Promise<ResourceWithPermissionGroupsAndTags<T>> {
  const sortedItems = await getResourceAssignedItemsSorted(
    context,
    workspaceId,
    resource.resourceId,
    resourceType
  );

  const updatedResource: ResourceWithPermissionGroupsAndTags<T> =
    resource as ResourceWithPermissionGroupsAndTags<T>;
  updatedResource.permissionGroups = [];
  updatedResource.tags = [];

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PermissionGroup:
        updatedResource.permissionGroups =
          assignedItemsToAssignedPermissionGroupList(sortedItems[type]);
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

export async function resourceListWithAssignedPermissionGroupsAndTags<
  T extends IResourceBase
>(
  context: IBaseContext,
  workspaceId: string,
  resources: T[],
  type: AppResourceType
) {
  return await Promise.all(
    resources.map(resource =>
      withAssignedPermissionGroupsAndTags(context, workspaceId, resource, type)
    )
  );
}

export async function withUserWorkspaces<T extends IUser>(
  context: IBaseContext,
  resource: T
): Promise<T & {workspaces: IUserWorkspace[]}> {
  const sortedItems = await getResourceAssignedItemsSorted(
    context,
    /** workspaceId */ '', // Empty string is used to fetch user workspaces
    resource.resourceId,
    AppResourceType.User
  );

  let assignedPermissionGroupItems: IAssignedItem[] = [];
  let assignedWorkspaceItems: IAssignedItem[] = [];
  const updatedResource: T & {workspaces: IUserWorkspace[]} = resource as T & {
    workspaces: IUserWorkspace[];
  };

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PermissionGroup:
        assignedPermissionGroupItems = sortedItems[type];
        break;

      case AppResourceType.Workspace:
        assignedWorkspaceItems = sortedItems[type];
        break;
    }
  }

  const assignedPermissionGroupsMap: Record<string, IAssignedItem[]> =
    assignedPermissionGroupItems.reduce((map, item) => {
      const workspacePermissionGroupItems = defaultTo(
        map[item.workspaceId],
        []
      );
      workspacePermissionGroupItems.push(item);
      map[item.workspaceId] = workspacePermissionGroupItems;
      return map;
    }, {} as Record<string, IAssignedItem[]>);

  updatedResource.workspaces = assignedItemsToAssignedWorkspaceList(
    assignedWorkspaceItems,
    assignedPermissionGroupsMap
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
