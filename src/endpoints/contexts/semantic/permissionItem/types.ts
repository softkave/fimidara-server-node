import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessPermissionItemProviderType
  extends SemanticDataAccessWorkspaceResourceProviderType<PermissionItem> {
  deleteManyByTargetId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
