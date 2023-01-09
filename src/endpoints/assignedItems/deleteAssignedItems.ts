import {AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/types';
import AssignedItemQueries from './queries';

export async function deleteResourceAssignedItems(
  context: IBaseContext,
  workspaceId: string,
  resourceId: string,
  resourceType: AppResourceType,
  assignedItemTypes?: AppResourceType[]
) {
  await context.data.assignedItem.deleteManyByQuery(
    AssignedItemQueries.getByAssignedToResource(workspaceId, resourceId, resourceType, assignedItemTypes)
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
