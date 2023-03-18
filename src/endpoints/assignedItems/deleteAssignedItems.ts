import {AppResourceType} from '../../definitions/system';
import {ISemanticDataAccessProviderMutationRunOptions} from '../contexts/semantic/types';
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
  assignedItemTypes: AppResourceType[] | undefined,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.assignedItem.deleteResourceAssignedItems(
    resourceId,
    assignedItemTypes,
    opts
  );
}

export async function deleteAssignableItemAssignedItems(
  context: IBaseContext,
  assignedItemId: string,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.assignedItem.deleteAssignedItemResources(assignedItemId, opts);
}
