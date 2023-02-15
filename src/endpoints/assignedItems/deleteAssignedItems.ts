import {AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/types';
import AssignedItemQueries from './queries';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param resourceType
 * @param assignedItemTypes
 */
export async function deleteResourceAssignedItems(
  context: IBaseContext,
  workspaceId: string | undefined,
  resourceId: string,
  resourceType: AppResourceType,
  assignedItemTypes?: AppResourceType[]
) {
  await context.data.assignedItem.deleteManyByQuery(
    AssignedItemQueries.getByAssignedToResource(
      workspaceId,
      resourceId,
      resourceType,
      assignedItemTypes
    )
  );
}

export async function deleteAssignableItemAssignedItems(
  context: IBaseContext,
  workspaceId: string,
  assignedItemId: string,
  assignedItemType: AppResourceType
) {
  await context.data.assignedItem.deleteManyByQuery(
    AssignedItemQueries.getByAssignedItem(workspaceId, assignedItemId, assignedItemType)
  );
}
