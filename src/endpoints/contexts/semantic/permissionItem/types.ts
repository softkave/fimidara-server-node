import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticPermissionItemProviderType
  extends SemanticWorkspaceResourceProviderType<PermissionItem> {
  getManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderQueryListParams<PermissionItem>
  ): Promise<PermissionItem[]>;
  getManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderQueryListParams<PermissionItem>
  ): Promise<PermissionItem[]>;
  deleteManyByTargetId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationParams
  ): Promise<void>;
  deleteManyByEntityId(
    workspaceId: string,
    id: string | string[],
    opts: SemanticProviderMutationParams
  ): Promise<void>;
}
