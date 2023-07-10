import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessWorkspaceResourceProviderType,
} from '../types';

export interface SemanticDataAccessPermissionItemProviderType<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<PermissionItem, TTxn> {
  deleteManyByTargetId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
