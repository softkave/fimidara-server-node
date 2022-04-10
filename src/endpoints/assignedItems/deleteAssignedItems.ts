import {AppResourceType} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import AssignedItemQueries from './queries';

export async function deleteResourceAssignedItems(
  context: IBaseContext,
  organizationId: string,
  resourceId: string,
  resourceType: AppResourceType,
  assignedItemType?: AppResourceType
) {
  await context.data.assignedItem.deleteManyItems(
    AssignedItemQueries.getByAssignedToResource(
      organizationId,
      resourceId,
      resourceType,
      assignedItemType
    )
  );
}

export async function deleteAssignableItemAssignedItems(
  context: IBaseContext,
  organizationId: string,
  assignedItemId: string,
  assignedItemType: AppResourceType
) {
  await context.data.assignedItem.deleteManyItems(
    AssignedItemQueries.getByAssignedItem(
      organizationId,
      assignedItemId,
      assignedItemType
    )
  );
}
