import {defaultTo} from 'lodash';
import {AssignedItem, ResourceWithTags} from '../../definitions/assignedItem';
import {AppResourceType, Resource} from '../../definitions/system';
import {User, UserWorkspace} from '../../definitions/user';
import {cast} from '../../utils/fns';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContext} from '../contexts/types';
import {assignedItemsToAssignedTagList, assignedItemsToAssignedWorkspaceList} from './utils';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes
 */
export async function getResourceAssignedItems(
  context: BaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>,
  opts?: ISemanticDataAccessProviderRunOptions
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
  context: BaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>,
  opts?: ISemanticDataAccessProviderRunOptions
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
  context: BaseContext,
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
  context: BaseContext,
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
  context: BaseContext,
  workspaceId: string,
  resources: T[],
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
) {
  return await Promise.all(
    resources.map(resource => populateAssignedTags<T, R>(context, workspaceId, resource, labels))
  );
}

export async function populateUserWorkspaces<T extends User>(
  context: BaseContext,
  resource: T,
  opts?: ISemanticDataAccessProviderRunOptions
): Promise<T & {workspaces: UserWorkspace[]}> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    /** workspaceId */ undefined,
    resource.resourceId,
    undefined,
    opts
  );
  let assignedWorkspaceItems: AssignedItem[] = [];
  const updatedResource: T & {workspaces: UserWorkspace[]} = resource as T & {
    workspaces: UserWorkspace[];
  };

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.Workspace:
        assignedWorkspaceItems = sortedItems[type];
        break;
    }
  }

  updatedResource.workspaces = assignedItemsToAssignedWorkspaceList(assignedWorkspaceItems);
  return updatedResource;
}

export async function populateUserListWithWorkspaces<T extends User>(
  context: BaseContext,
  resources: T[]
) {
  return await Promise.all(resources.map(resource => populateUserWorkspaces(context, resource)));
}
