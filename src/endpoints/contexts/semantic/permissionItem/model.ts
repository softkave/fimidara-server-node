import {PermissionItem} from '../../../../definitions/permissionItem';
import {toCompactArray} from '../../../../utils/fns';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationTxnOptions} from '../types';
import {SemanticPermissionItemProviderType} from './types';

export class DataSemanticPermissionItem
  extends DataSemanticWorkspaceResourceProvider<PermissionItem>
  implements SemanticPermissionItemProviderType
{
  async deleteManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {workspaceId, entityId: {$in: toCompactArray(id)}},
      opts
    );
  }

  async deleteManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void> {
    await this.data.deleteManyByQuery(
      {workspaceId, targetId: {$in: toCompactArray(id)}},
      opts
    );
  }

  async getManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<PermissionItem[]> {
    return await this.data.getManyByQuery(
      {workspaceId, entityId: {$in: toCompactArray(id)}},
      opts
    );
  }

  async getManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<PermissionItem[]> {
    return await this.data.getManyByQuery(
      {workspaceId, targetId: {$in: toCompactArray(id)}},
      opts
    );
  }
}
