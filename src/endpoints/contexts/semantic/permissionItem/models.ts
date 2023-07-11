import {PermissionItem} from '../../../../definitions/permissionItem';
import {toNonNullableArray} from '../../../../utils/fns';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessProviderMutationRunOptions} from '../types';
import {SemanticDataAccessPermissionItemProviderType} from './types';

export class DataSemanticDataAccessPermissionItem
  extends DataSemanticDataAccessWorkspaceResourceProvider<PermissionItem>
  implements SemanticDataAccessPermissionItemProviderType
{
  async deleteManyByEntityId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery({entityId: {$in: toNonNullableArray(id)}}, opts);
  }

  async deleteManyByTargetId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery({targetId: {$in: toNonNullableArray(id)}}, opts);
  }
}
