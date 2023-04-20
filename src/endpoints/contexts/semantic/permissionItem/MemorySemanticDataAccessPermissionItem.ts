import {PermissionItem} from '../../../../definitions/permissionItem';
import {toNonNullableArray} from '../../../../utils/fns';
import {SemanticDataAccessProviderMutationRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessPermissionItemProvider} from './types';

export class MemorySemanticDataAccessPermissionItem
  extends SemanticDataAccessWorkspaceResourceProvider<PermissionItem>
  implements ISemanticDataAccessPermissionItemProvider
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
