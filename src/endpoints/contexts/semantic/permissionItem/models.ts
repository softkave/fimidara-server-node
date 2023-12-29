import {PermissionItem} from '../../../../definitions/permissionItem';
import {toCompactArray} from '../../../../utils/fns';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
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
    await this.data.deleteManyByQuery({entityId: {$in: toCompactArray(id)}}, opts);
  }

  async deleteManyByTargetId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery({targetId: {$in: toCompactArray(id)}}, opts);
  }

  async getManyByEntityId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<PermissionItem[]> {
    return await this.data.getManyByQuery({entityId: {$in: toCompactArray(id)}}, opts);
  }

  async getManyByTargetId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<PermissionItem[]> {
    return await this.data.getManyByQuery({targetId: {$in: toCompactArray(id)}}, opts);
  }
}
