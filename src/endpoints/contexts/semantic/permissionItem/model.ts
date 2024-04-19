import {PermissionItem} from '../../../../definitions/permissionItem';
import {toCompactArray} from '../../../../utils/fns';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderMutationParams, SemanticProviderQueryListParams} from '../types';
import {SemanticPermissionItemProviderType} from './types';

export class DataSemanticPermissionItem
  extends DataSemanticWorkspaceResourceProvider<PermissionItem>
  implements SemanticPermissionItemProviderType
{
  async deleteManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<PermissionItem>>(
      {workspaceId, entityId: {$in: toCompactArray(id)}},
      opts?.includeDeleted || true
    );
    await this.data.deleteManyByQuery(query, opts);
  }

  async deleteManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationParams
  ): Promise<void> {
    const query = addIsDeletedIntoQuery<DataQuery<PermissionItem>>(
      {workspaceId, targetId: {$in: toCompactArray(id)}},
      opts?.includeDeleted || true
    );
    await this.data.deleteManyByQuery(query, opts);
  }

  async getManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderQueryListParams<PermissionItem>
  ): Promise<PermissionItem[]> {
    const query = addIsDeletedIntoQuery<DataQuery<PermissionItem>>(
      {workspaceId, entityId: {$in: toCompactArray(id)}},
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, opts);
  }

  async getManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderQueryListParams<PermissionItem>
  ): Promise<PermissionItem[]> {
    const query = addIsDeletedIntoQuery<DataQuery<PermissionItem>>(
      {workspaceId, targetId: {$in: toCompactArray(id)}},
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, opts);
  }
}
