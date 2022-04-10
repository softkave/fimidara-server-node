import {defaultTo} from 'lodash';
import {
  IAssignedItem,
  ResourceWithPresetsAndTags,
} from '../../definitions/assignedItem';
import {AppResourceType, IResourceBase} from '../../definitions/system';
import {IUser, IUserOrganization} from '../../definitions/user';
import {IBaseContext} from '../contexts/BaseContext';
import AssignedItemQueries from './queries';
import {
  assignedItemsToAssignedOrgList,
  assignedItemsToAssignedPresetList,
  assignedItemsToAssignedTagList,
} from './utils';

export async function getResourceAssignedItems(
  context: IBaseContext,

  // Use empty string for fetching user organizations
  organizationId: string,
  resourceId: string,
  resourceType: AppResourceType
) {
  return await context.data.assignedItem.getManyItems(
    AssignedItemQueries.getByAssignedToResource(
      organizationId,
      resourceId,
      resourceType
    )
  );
}

export async function getAssignableItemAssignedItems(
  context: IBaseContext,
  organizationId: string,
  assignedItemId: string,
  assignedItemType: AppResourceType
) {
  return await context.data.assignedItem.getManyItems(
    AssignedItemQueries.getByAssignedItem(
      organizationId,
      assignedItemId,
      assignedItemType
    )
  );
}

export async function getResourceAssignedItemsSorted(
  context: IBaseContext,

  // Use empty string for fetching user organizations
  organizationId: string,
  resourceId: string,
  resourceType: AppResourceType
) {
  const items = await getResourceAssignedItems(
    context,
    organizationId,
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
  organizationId: string,
  resource: T,
  resourceType: AppResourceType
): Promise<ResourceWithPresetsAndTags<T>> {
  const sortedItems = await getResourceAssignedItemsSorted(
    context,
    organizationId,
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
  organizationId: string,
  resources: T[],
  type: AppResourceType
) {
  return await Promise.all(
    resources.map(resource =>
      withAssignedPresetsAndTags(context, organizationId, resource, type)
    )
  );
}

export async function withUserOrganizations<T extends IUser>(
  context: IBaseContext,
  resource: T
): Promise<T & {organizations: IUserOrganization[]}> {
  const sortedItems = await getResourceAssignedItemsSorted(
    context,
    '', // Empty string is used to fetch user organizations
    resource.resourceId,
    AppResourceType.User
  );

  const updatedResource: T & {organizations: IUserOrganization[]} =
    resource as T & {organizations: IUserOrganization[]};
  let assignedPresetItems: IAssignedItem[] = [];
  let assignedOrgItems: IAssignedItem[] = [];

  for (const type in sortedItems) {
    switch (type) {
      case AppResourceType.PresetPermissionsGroup:
        assignedPresetItems = sortedItems[type];
        break;

      case AppResourceType.Tag:
        assignedOrgItems = sortedItems[type];
        break;
    }
  }

  const assignedPresetsMap: Record<string, IAssignedItem[]> =
    assignedPresetItems.reduce((map, item) => {
      const orgPresetItems = defaultTo(map[item.organizationId], []);
      orgPresetItems.push(item);
      map[item.organizationId] = orgPresetItems;
      return map;
    }, {} as Record<string, IAssignedItem[]>);

  updatedResource.organizations = assignedItemsToAssignedOrgList(
    assignedOrgItems,
    assignedPresetsMap
  );

  return updatedResource;
}

export async function userListWithOrganizations<T extends IUser>(
  context: IBaseContext,
  resources: T[]
) {
  return await Promise.all(
    resources.map(resource => withUserOrganizations(context, resource))
  );
}
