import {PermissionItem} from '../../../../definitions/permissionItem';
import {toNonNullableArray} from '../../../../utils/fns';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
import {SemanticProviderMutationRunOptions} from '../types';
import {SemanticPermissionItemProviderType} from './types';

export class DataSemanticPermissionItem
  extends DataSemanticWorkspaceResourceProvider<PermissionItem>
  implements SemanticPermissionItemProviderType
{
  async deleteManyByEntityId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery({entityId: {$in: toNonNullableArray(id)}}, opts);
  }

  async deleteManyByTargetId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery({targetId: {$in: toNonNullableArray(id)}}, opts);
  }
}
