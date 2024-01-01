import {AppResourceType} from '../../definitions/system';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderMutationRunOptions} from '../contexts/semantic/types';

export async function deleteResourceAssignedItems(
  /** Use `undefined` for fetching user workspaces */ workspaceId: string,
  resourceId: string | string[],
  assignedItemTypes: AppResourceType[] | undefined,
  opts: SemanticProviderMutationRunOptions
) {
  await kSemanticModels
    .assignedItem()
    .deleteResourceAssignedItems(workspaceId, resourceId, assignedItemTypes, opts);
}

export async function deleteAssignableItemAssignedItems(
  workspaceId: string,
  assignedItemId: string,
  opts: SemanticProviderMutationRunOptions
) {
  await kSemanticModels
    .assignedItem()
    .deleteResourceAssigneeItems(workspaceId, assignedItemId, opts);
}
