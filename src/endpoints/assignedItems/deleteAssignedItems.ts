import {AppResourceType} from '../../definitions/system';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderMutationTxnOptions} from '../contexts/semantic/types';

export async function deleteResourceAssignedItems(
  /** Use `undefined` for fetching user workspaces */ workspaceId: string,
  resourceId: string | string[],
  assignedItemTypes: AppResourceType[] | undefined,
  opts: SemanticProviderMutationTxnOptions
) {
  await kSemanticModels
    .assignedItem()
    .deleteResourceAssignedItems(workspaceId, resourceId, assignedItemTypes, opts);
}

export async function deleteAssignableItemAssignedItems(
  workspaceId: string,
  assignedItemId: string,
  opts: SemanticProviderMutationTxnOptions
) {
  await kSemanticModels
    .assignedItem()
    .deleteResourceAssigneeItems(workspaceId, assignedItemId, opts);
}
