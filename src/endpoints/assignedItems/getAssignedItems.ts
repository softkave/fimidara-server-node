import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  ResourceWithPermissionGroups,
  ResourceWithPermissionGroupsAndTags,
  ResourceWithTags,
} from '../../definitions/assignedItem';
import {AppResourceType, IResourceBase} from '../../definitions/system';
import {IUser, IUserWorkspace} from '../../definitions/user';
import {cast} from '../../utils/fns';
import {IBaseContext} from '../contexts/types';
import AssignedItemQueries from './queries';
import {
  assignedItemsToAssignedPermissionGroupList,
  assignedItemsToAssignedTagList,
  assignedItemsToAssignedWorkspaceList,
} from './utils';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param resourceType
 * @param assignedItemTypes
 */
export async function getResourceAssignedItems(
  context: IBaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  resourceType: AppResourceType,
  assignedItemTypes?: ReadonlyArray<AppResourceType>
) {
  return await context.data.assignedItem.getManyByQuery(
    AssignedItemQueries.getByAssignedToResource(
      workspaceId,
      resourceId,
      resourceType,
      assignedItemTypes
    )
  );
}

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param resourceType
 * @param assignedItemTypes - List of assigned item types to fetch. If not
 * specified, all assigned items will be fetched. If specified, result will
 * contain empty arrays if no assigned items of the specified type are found.
 */
export async function getResourceAssignedItemsSortedByType(
  context: IBaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  resourceType: AppResourceType,
  assignedItemTypes?: ReadonlyArray<AppResourceType>
) {
  const items = await getResourceAssignedItems(
    context,
    workspaceId,
    resourceId,
    resourceType,
    assignedItemTypes
  );

  // Add default values if specific assigned item types are specified
  const sortedItems: Record<string, IAssignedItem[]> = assignedItemTypes
    ? assignedItemTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, IAssignedItem[]>)
    : {};

  items.forEach(item => {
    const typeItems = defaultTo(sortedItems[item.assignedItemType], []);
    typeItems.push(item);
    sortedItems[item.assignedItemType] = typeItems;
  });

  return sortedItems;
}

export async function populateAssignedItems<
  T extends IResourceBase,
  AT extends ReadonlyArray<AppResourceType.PermissionGroup | AppResourceType.Tag>
>(
  context: IBaseContext,
  workspaceId: string,
  resource: T,
  resourceType: AppResourceType,
  assignedItemTypes: AT = [AppResourceType.PermissionGroup, AppResourceType.Tag] as any
): Promise<
  typeof assignedItemTypes extends ReadonlyArray<AppResourceType.PermissionGroup>
    ? ResourceWithPermissionGroups<T>
    : typeof assignedItemTypes extends ReadonlyArray<AppResourceType.Tag>
    ? ResourceWithTags<T>
    : ResourceWithPermissionGroupsAndTags<T>
> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    workspaceId,
    resource.resourceId,
    resourceType,
    assignedItemTypes
  );

  const updatedResource = cast<any>(resource);

  // prefill expected fields with empty arrays
  assignedItemTypes?.forEach(type => {
    switch (type) {
      case AppResourceType.PermissionGroup:
        cast<ResourceWithPermissionGroups<T>>(updatedResource).permissionGroups = [];
        break;
      case AppResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags = [];
        break;
    }
  });

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PermissionGroup:
        cast<ResourceWithPermissionGroups<T>>(updatedResource).permissionGroups =
          assignedItemsToAssignedPermissionGroupList(sortedItems[type]);
        break;

      case AppResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags = assignedItemsToAssignedTagList(
          sortedItems[type]
        );
        break;
    }
  }

  return updatedResource;
}

export async function populateAssignedPermissionGroupsAndTags<
  T extends IResourceBase,
  R extends T | undefined = undefined,
  Final = R extends undefined ? ResourceWithPermissionGroupsAndTags<T> : R
>(
  context: IBaseContext,
  workspaceId: string,
  resource: T,
  resourceType: AppResourceType,
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {},
  includePermissionGroups: boolean = true,
  includeTags: boolean = true
): Promise<Final> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    workspaceId,
    resource.resourceId,
    resourceType,
    [AppResourceType.PermissionGroup, AppResourceType.Tag]
  );

  const updatedResource: Final = cast<Final>(resource);
  const permissionGroupsLabel = labels[AppResourceType.PermissionGroup] || 'permissionGroups';
  const tagsLabel = labels[AppResourceType.Tag] || 'tags';
  if (includePermissionGroups) {
    (updatedResource as any)[permissionGroupsLabel] = [];
  }

  if (includeTags) {
    (updatedResource as any)[tagsLabel] = [];
  }

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PermissionGroup:
        if (includePermissionGroups) {
          (updatedResource as any)[permissionGroupsLabel] =
            assignedItemsToAssignedPermissionGroupList(sortedItems[type]);
        }
        break;

      case AppResourceType.Tag:
        if (includeTags) {
          (updatedResource as any)[tagsLabel] = assignedItemsToAssignedTagList(sortedItems[type]);
        }
        break;
    }
  }

  return updatedResource;
}

export async function populateResourceListWithAssignedPermissionGroupsAndTags<
  T extends IResourceBase,
  R extends T | undefined = undefined
>(
  context: IBaseContext,
  workspaceId: string,
  resources: T[],
  type: AppResourceType,
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {},
  includePermissionGroups: boolean = true,
  includeTags: boolean = true
) {
  return await Promise.all(
    resources.map(resource =>
      populateAssignedPermissionGroupsAndTags<T, R>(
        context,
        workspaceId,
        resource,
        type,
        labels,
        includePermissionGroups,
        includeTags
      )
    )
  );
}

export async function populateUserWorkspaces<T extends IUser>(
  context: IBaseContext,
  resource: T
): Promise<T & {workspaces: IUserWorkspace[]}> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    /** workspaceId */ undefined,
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
      const workspacePermissionGroupItems = defaultTo(map[item.workspaceId], []);
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

export async function populateUserListWithWorkspaces<T extends IUser>(
  context: IBaseContext,
  resources: T[]
) {
  return await Promise.all(resources.map(resource => populateUserWorkspaces(context, resource)));
}
