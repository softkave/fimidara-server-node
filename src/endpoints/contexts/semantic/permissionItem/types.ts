import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderQueryListRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticPermissionItemProviderType
  extends SemanticWorkspaceResourceProviderType<PermissionItem> {
  getManyByTargetId(
    id: string | string[],
    opts: SemanticProviderQueryListRunOptions<PermissionItem>
  ): Promise<PermissionItem[]>;
  getManyByEntityId(
    id: string | string[],
    opts: SemanticProviderQueryListRunOptions<PermissionItem>
  ): Promise<PermissionItem[]>;
  deleteManyByTargetId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
}
