import {AppResourceType} from '../../definitions/system';
import {SemanticDataAccessProviderMutationRunOptions} from '../contexts/semantic/types';
import {BaseContext} from '../contexts/types';

/**
 * @param context
 * @param workspaceId - Use `undefined` for fetching user workspaces
 * @param resourceId
 * @param assignedItemTypes
 */
export async function deleteResourceAssignedItems(
  context: BaseContext,
  workspaceId: string,
  resourceId: string | string[],
  assignedItemTypes: AppResourceType[] | undefined,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
    workspaceId,
    resourceId,
    assignedItemTypes,
    opts
  );
}

export async function deleteAssignableItemAssignedItems(
  context: BaseContext,
  workspaceId: string,
  assignedItemId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  await context.semantic.assignedItem.deleteWorkspaceAssignedItemResources(
    workspaceId,
    assignedItemId,
    opts
  );
}
