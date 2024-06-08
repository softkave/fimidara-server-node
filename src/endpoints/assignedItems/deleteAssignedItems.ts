import {FimidaraResourceType} from '../../definitions/system.js';
import {kSemanticModels} from '../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../contexts/semantic/types.js';

export async function deleteResourceAssignedItems(
  /** Use `undefined` for fetching user workspaces */ workspaceId: string,
  resourceId: string | string[],
  assignedItemTypes: FimidaraResourceType[] | undefined,
  opts: SemanticProviderMutationParams
) {
  await kSemanticModels
    .assignedItem()
    .deleteByAssigned(workspaceId, resourceId, assignedItemTypes, opts);
}
