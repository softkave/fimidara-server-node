import {PermissionItem} from '../../../../definitions/permissionItem';
import {toNonNullableArray} from '../../../../utils/fns';
import {SemanticDataAccessProviderMutationRunOptions} from '../types';
import {MemorySemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessPermissionItemProviderType} from './types';

export class MemorySemanticDataAccessPermissionItem
  extends MemorySemanticDataAccessWorkspaceResourceProvider<PermissionItem>
  implements SemanticDataAccessPermissionItemProviderType
{
  async deleteManyByEntityId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(
      {entityId: {$in: toNonNullableArray(id)}},
      opts.transaction
    );
  }

  async deleteManyByTargetId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.memstore.deleteManyItems(
      {targetId: {$in: toNonNullableArray(id)}},
      opts.transaction
    );
  }
}
