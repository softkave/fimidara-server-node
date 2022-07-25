import {AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import AssignedItemQueries from './queries';

export async function deleteResourceAssignedItems(
  context: IBaseContext,
  workspaceId: string,
  resourceId: string,
  resourceType: AppResourceType,
  assignedItemTypes?: AppResourceType[]
) {
  await context.data.assignedItem.deleteManyItems(
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
  await context.data.assignedItem.deleteManyItems(
    AssignedItemQueries.getByAssignedItem(
      workspaceId,
      assignedItemId,
      assignedItemType
    )
  );
}
