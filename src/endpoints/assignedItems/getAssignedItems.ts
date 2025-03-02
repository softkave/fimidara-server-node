import {defaultTo} from 'lodash-es';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
} from '../../contexts/semantic/types.js';
import {
  AssignedItem,
  ResourceWithTags,
} from '../../definitions/assignedItem.js';
import {
  FimidaraResourceType,
  Resource,
  WorkspaceResource,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {User} from '../../definitions/user.js';
import {cast} from '../../utils/fns.js';
import {
  assignedItemsToAssignedTagList,
  assignedItemsToAssignedWorkspaceList,
} from './utils.js';

export async function getResourceAssignedItems(
  /** Use `undefined` for fetching user workspaces */
  workspaceId: string | undefined,
  resourceId: string,
  assignedItemTypes?: Array<FimidaraResourceType>,
  opts?: SemanticProviderQueryListParams<AssignedItem>
) {
  return await kIjxSemantic
    .assignedItem()
    .getByAssignee(workspaceId, resourceId, assignedItemTypes, opts);
}

export async function getResourceAssignedItemsSortedByType(
  /** Use `undefined` for fetching user workspaces */
  workspaceId: string | undefined,
  resourceId: string,
  /** List of assigned item types to fetch. If not specified, all assigned items
   * will be fetched. If specified, result will contain empty arrays if no
   * assigned items of the specified type are found. */
  assignedItemTypes?: Array<FimidaraResourceType>,
  opts?: SemanticProviderQueryListParams<AssignedItem>
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
  TAssignedItemsType extends Array<typeof kFimidaraResourceType.Tag>,
>(
  workspaceId: string,
  resource: T,
  assignedItemTypes: TAssignedItemsType = [
    kFimidaraResourceType.Tag,
  ] as TAssignedItemsType
): Promise<
  typeof assignedItemTypes extends Array<typeof kFimidaraResourceType.Tag>
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
      case kFimidaraResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags = [];
        break;
    }
  });

  for (const type in sortedItems) {
    switch (type) {
      case kFimidaraResourceType.Tag:
        cast<ResourceWithTags<T>>(updatedResource).tags =
          assignedItemsToAssignedTagList(sortedItems[type]);
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
  labels: Partial<Record<FimidaraResourceType, keyof Omit<R, keyof T>>> = {}
): Promise<NonNullable<Final>> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    workspaceId,
    resource.resourceId,
    [kFimidaraResourceType.Tag]
  );
  const updatedResource = cast<NonNullable<Final>>(resource);
  const tagsLabel = labels[kFimidaraResourceType.Tag] ?? 'tags';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (updatedResource as any)[tagsLabel] = assignedItemsToAssignedTagList(
    sortedItems[kFimidaraResourceType.Tag]
  );
  return updatedResource;
}

export async function populateResourceListWithAssignedTags<
  T extends Resource,
  R extends T | undefined = undefined,
>(
  workspaceId: string,
  resources: T[],
  labels: Partial<Record<FimidaraResourceType, keyof Omit<R, keyof T>>> = {}
) {
  return await Promise.all(
    resources.map(resource =>
      populateAssignedTags<T, R>(workspaceId, resource, labels)
    )
  );
}

export async function getUserWorkspaces(
  userId: string,
  opts?: SemanticProviderOpParams
): Promise<WorkspaceResource[]> {
  const sortedItems = await getResourceAssignedItemsSortedByType(
    /** workspaceId */ undefined,
    userId,
    undefined,
    opts
  );
  let assignedWorkspaceItems: AssignedItem[] = [];

  for (const type in sortedItems) {
    switch (type) {
      case kFimidaraResourceType.Workspace:
        assignedWorkspaceItems = sortedItems[type];
        break;
    }
  }

  return assignedItemsToAssignedWorkspaceList(assignedWorkspaceItems);
}

export async function populateUserWorkspaces<T extends User>(
  resource: T,
  opts?: SemanticProviderOpParams
): Promise<T & {workspaces: WorkspaceResource[]}> {
  const updatedResource = resource as T & {
    workspaces: WorkspaceResource[];
  };
  updatedResource.workspaces = await getUserWorkspaces(
    resource.resourceId,
    opts
  );
  return updatedResource;
}

export async function populateUserListWithWorkspaces<T extends User>(
  resources: T[]
) {
  return await Promise.all(
    resources.map(resource => populateUserWorkspaces(resource))
  );
}
