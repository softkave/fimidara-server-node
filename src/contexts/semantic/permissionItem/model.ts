import {PermissionItem} from '../../../definitions/permissionItem.js';
import {toCompactArray} from '../../../utils/fns.js';
import {DataQuery} from '../../data/types.js';
import {addIsDeletedIntoQuery} from '../SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from '../SemanticWorkspaceResourceProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../types.js';
import {SemanticPermissionItemProviderType} from './types.js';

export class DataSemanticPermissionItem
  extends SemanticWorkspaceResourceProvider<PermissionItem>
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
