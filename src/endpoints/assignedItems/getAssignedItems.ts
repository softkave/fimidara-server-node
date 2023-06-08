import {defaultTo} from 'lodash';
import {AssignedItem, ResourceWithTags} from '../../definitions/assignedItem';
import {AppResourceType, Resource} from '../../definitions/system';
import {User, UserWorkspace} from '../../definitions/user';
import {cast} from '../../utils/fns';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {assignedItemsToAssignedTagList, assignedItemsToAssignedWorkspaceList} from './utils';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes
 */
export async function getResourceAssignedItems(
  context: BaseContextType,
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>,
  opts?: SemanticDataAccessProviderRunOptions
) {
  return await context.semantic.assignedItem.getWorkspaceResourceAssignedItems(
    workspaceId,
    resourceId,
    assignedItemTypes,
    opts
  );
}

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes - List of assigned item types to fetch. If not
 * specified, all assigned items will be fetched. If specified, result will
 * contain empty arrays if no assigned items of the specified type are found.
 */
export async function getResourceAssignedItemsSortedByType(
  context: BaseContextType,
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const items = await getResourceAssignedItems(
    context,
    workspaceId,
    resourceId,
    assignedItemTypes,
    opts
  );

  // Add default values if specific assigned item types are specified
  const sortedItems: Record<string, AssignedItem[]> = assignedItemTypes
    ? assignedItemTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, AssignedItem[]>)
    : {};

  items.forEach(item => {
    const typeItems = defaultTo(sortedItems[item.assignedItemType], []);
    typeItems.push(item);
    sortedItems[item.assignedItemType] = typeItems;
  });

  return sortedItems;
}

export async function populateAssignedItems<
  T extends Resource,
  AT extends Array<AppResourceType.Tag>
>(
  context: BaseContextType,
  workspaceId: string,
  resource: T,
  assignedItemTypes: AT = [AppResourceType.Tag] as any
): Promise<
  typeof assignedItemTypes extends Array<AppResourceType.Tag>
    ? ResourceWithTags<T>
    : ResourceWithTags<T>
> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    workspaceId,
    resource.resourceId,
    assignedItemTypes
  );

  const updatedResource = cast<any>(resource);

  // prefill expected fields with empty arrays
  assignedItemTypes?.forEach(type => {
    switch (type) {
      case AppResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags = [];
        break;
    }
  });

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags = assignedItemsToAssignedTagList(
          sortedItems[type]
        );
        break;
    }
  }

  return updatedResource;
}

export async function populateAssignedTags<
  T extends Resource,
  R extends T | undefined = undefined,
  Final = R extends undefined ? ResourceWithTags<T> : R
>(
  context: BaseContextType,
  workspaceId: string,
  resource: NonNullable<T>,
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
): Promise<NonNullable<Final>> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    workspaceId,
    resource.resourceId,
    [AppResourceType.Tag]
  );
  const updatedResource = cast<NonNullable<Final>>(resource);
  const tagsLabel = labels[AppResourceType.Tag] ?? 'tags';
  (updatedResource as any)[tagsLabel] = assignedItemsToAssignedTagList(
    sortedItems[AppResourceType.Tag]
  );
  return updatedResource;
}

export async function populateResourceListWithAssignedTags<
  T extends Resource,
  R extends T | undefined = undefined
>(
  context: BaseContextType,
  workspaceId: string,
  resources: T[],
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
) {
  return await Promise.all(
    resources.map(resource => populateAssignedTags<T, R>(context, workspaceId, resource, labels))
  );
}

export async function getUserWorkspaces(
  context: BaseContextType,
  userId: string,
  opts?: SemanticDataAccessProviderRunOptions
): Promise<UserWorkspace[]> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    /** workspaceId */ undefined,
    userId,
    undefined,
    opts
  );
  let assignedWorkspaceItems: AssignedItem[] = [];

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.Workspace:
        assignedWorkspaceItems = sortedItems[type];
        break;
    }
  }

  return assignedItemsToAssignedWorkspaceList(assignedWorkspaceItems);
}

export async function populateUserWorkspaces<T extends User>(
  context: BaseContextType,
  resource: T,
  opts?: SemanticDataAccessProviderRunOptions
): Promise<T & {workspaces: UserWorkspace[]}> {
  const updatedResource: T & {workspaces: UserWorkspace[]} = resource as T & {
    workspaces: UserWorkspace[];
  };
  updatedResource.workspaces = await getUserWorkspaces(context, resource.resourceId, opts);
  return updatedResource;
}

export async function populateUserListWithWorkspaces<T extends User>(
  context: BaseContextType,
  resources: T[]
) {
  return await Promise.all(resources.map(resource => populateUserWorkspaces(context, resource)));
}
