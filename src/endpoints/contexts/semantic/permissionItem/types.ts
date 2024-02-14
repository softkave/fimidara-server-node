import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderQueryListRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticPermissionItemProviderType
  extends SemanticWorkspaceResourceProviderType<PermissionItem> {
  getManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderQueryListRunOptions<PermissionItem>
  ): Promise<PermissionItem[]>;
  getManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderQueryListRunOptions<PermissionItem>
  ): Promise<PermissionItem[]>;
  deleteManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  deleteManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationTxnOptions
  ): Promise<void>;
}
