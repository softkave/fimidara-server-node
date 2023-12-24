import {defaultTo} from 'lodash';
import {AssignedItem, ResourceWithTags} from '../../definitions/assignedItem';
import {AppResourceType, Resource, kAppResourceType} from '../../definitions/system';
import {User, UserWorkspace} from '../../definitions/user';
import {cast} from '../../utils/fns';
import {kSemanticModels} from '../contexts/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {
  assignedItemsToAssignedTagList,
  assignedItemsToAssignedWorkspaceList,
} from './utils';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes
 */
export async function getResourceAssignedItems(
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>,
  opts?: SemanticProviderRunOptions
) {
  return await kSemanticModels
    .assignedItem()
    .getWorkspaceResourceAssignedItems(workspaceId, resourceId, assignedItemTypes, opts);
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
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<AppResourceType>,
  opts?: SemanticProviderRunOptions
) {
  const items = await getResourceAssignedItems(
    workspaceId,
    resourceId,
    assignedItemTypes,
    opts
  );

  // Add default values if specific assigned item types are specified
  const sortedItems: Record<string, AssignedItem[]> = assignedItemTypes
    ? assignedItemTypes.reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<string, AssignedItem[]>
      )
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
  TAssignedItemsType extends Array<typeof kAppResourceType.Tag>,
>(
  workspaceId: string,
  resource: T,
  // @ts-ignore
  assignedItemTypes: TAssignedItemsType = [kAppResourceType.Tag]
): Promise<
  typeof assignedItemTypes extends Array<typeof kAppResourceType.Tag>
    ? ResourceWithTags<T>
    : ResourceWithTags<T>
> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    workspaceId,
    resource.resourceId,
    assignedItemTypes
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatedResource = cast<any>(resource);

  // prefill expected fields with empty arrays
  assignedItemTypes?.forEach(type => {
    switch (type) {
      case kAppResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags = [];
        break;
    }
  });

  for (const type in sortedItems) {
    switch (type) {
      case kAppResourceType.Tag:
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
  Final = R extends undefined ? ResourceWithTags<T> : R,
>(
  workspaceId: string,
  resource: NonNullable<T>,
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
): Promise<NonNullable<Final>> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    workspaceId,
    resource.resourceId,
    [kAppResourceType.Tag]
  );
  const updatedResource = cast<NonNullable<Final>>(resource);
  const tagsLabel = labels[kAppResourceType.Tag] ?? 'tags';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (updatedResource as any)[tagsLabel] = assignedItemsToAssignedTagList(
    sortedItems[kAppResourceType.Tag]
  );
  return updatedResource;
}

export async function populateResourceListWithAssignedTags<
  T extends Resource,
  R extends T | undefined = undefined,
>(
  workspaceId: string,
  resources: T[],
  labels: Partial<Record<AppResourceType, keyof Omit<R, keyof T>>> = {}
) {
  return await Promise.all(
    resources.map(resource => populateAssignedTags<T, R>(workspaceId, resource, labels))
  );
}

export async function getUserWorkspaces(
  userId: string,
  opts?: SemanticProviderRunOptions
): Promise<UserWorkspace[]> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    /** workspaceId */ undefined,
    userId,
    undefined,
    opts
  );
  let assignedWorkspaceItems: AssignedItem[] = [];

  for (const type in sortedItems) {
    switch (type) {
      case kAppResourceType.Workspace:
        assignedWorkspaceItems = sortedItems[type];
        break;
    }
  }

  return assignedItemsToAssignedWorkspaceList(assignedWorkspaceItems);
}

export async function populateUserWorkspaces<T extends User>(
  resource: T,
  opts?: SemanticProviderRunOptions
): Promise<T & {workspaces: UserWorkspace[]}> {
  const updatedResource: T & {workspaces: UserWorkspace[]} = resource as T & {
    workspaces: UserWorkspace[];
  };
  updatedResource.workspaces = await getUserWorkspaces(resource.resourceId, opts);
  return updatedResource;
}

export async function populateUserListWithWorkspaces<T extends User>(resources: T[]) {
  return await Promise.all(resources.map(resource => populateUserWorkspaces(resource)));
}
