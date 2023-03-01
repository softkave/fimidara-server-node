import {AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/types';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes
 */
export async function deleteResourceAssignedItems(
  context: IBaseContext,
  resourceId: string | string[],
  assignedItemTypes?: AppResourceType[]
) {
  await context.semantic.assignedItem.deleteResourceAssignedItems(resourceId, assignedItemTypes);
}

export async function deleteAssignableItemAssignedItems(
  context: IBaseContext,
  assignedItemId: string
) {
  await context.semantic.assignedItem.deleteAssignedItemResources(assignedItemId);
}
