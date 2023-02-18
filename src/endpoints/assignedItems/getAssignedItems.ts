import {defaultTo} from 'lodash';
import {IAssignedItem, ResourceWithTags} from '../../definitions/assignedItem';
import {AppResourceType, IResourceBase} from '../../definitions/system';
import {IUser, IUserWorkspace} from '../../definitions/user';
import {cast} from '../../utils/fns';
import {IBaseContext} from '../contexts/types';
import AssignedItemQueries from './queries';
import {assignedItemsToAssignedTagList, assignedItemsToAssignedWorkspaceList} from './utils';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes
 */
export async function getResourceAssignedItems(
  context: IBaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>
) {
  return await context.data.assignedItem.getManyByQuery(
    AssignedItemQueries.getByAssignedToResource(workspaceId, resourceId, assignedItemTypes)
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
  context: IBaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>
) {
  const items = await getResourceAssignedItems(context, workspaceId, resourceId, assignedItemTypes);

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
  AT extends Array<AppResourceType.Tag>
>(
  context: IBaseContext,
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
  T extends IResourceBase,
  R extends T | undefined = undefined,
  Final = R extends undefined ? ResourceWithTags<T> : R
>(
  context: IBaseContext,
  workspaceId: string,
  resource: T,
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
): Promise<Final> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    workspaceId,
    resource.resourceId,
    [AppResourceType.Tag]
  );
  const updatedResource: Final = cast<Final>(resource);
  const tagsLabel = labels[AppResourceType.Tag] ?? 'tags';
  (updatedResource as any)[tagsLabel] = assignedItemsToAssignedTagList(
    sortedItems[AppResourceType.Tag]
  );
  return updatedResource;
}

export async function populateResourceListWithAssignedTags<
  T extends IResourceBase,
  R extends T | undefined = undefined
>(
  context: IBaseContext,
  workspaceId: string,
  resources: T[],
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
) {
  return await Promise.all(
    resources.map(resource => populateAssignedTags<T, R>(context, workspaceId, resource, labels))
  );
}

export async function populateUserWorkspaces<T extends IUser>(
  context: IBaseContext,
  resource: T
): Promise<T & {workspaces: IUserWorkspace[]}> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    context,
    /** workspaceId */ undefined,
    resource.resourceId
  );
  let assignedWorkspaceItems: IAssignedItem[] = [];
  const updatedResource: T & {workspaces: IUserWorkspace[]} = resource as T & {
    workspaces: IUserWorkspace[];
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

export async function populateUserListWithWorkspaces<T extends IUser>(
  context: IBaseContext,
  resources: T[]
) {
  return await Promise.all(resources.map(resource => populateUserWorkspaces(context, resource)));
}
