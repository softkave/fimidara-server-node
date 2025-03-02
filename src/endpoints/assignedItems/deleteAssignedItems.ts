import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {FimidaraResourceType} from '../../definitions/system.js';

export async function deleteResourceAssignedItems(
  /** Use `undefined` for fetching user workspaces */ workspaceId: string,
  resourceId: string | string[],
  assignedItemTypes: FimidaraResourceType[] | undefined,
  opts: SemanticProviderMutationParams
) {
  await kIjxSemantic
    .assignedItem()
    .deleteByAssigned(workspaceId, resourceId, assignedItemTypes, opts);
}
