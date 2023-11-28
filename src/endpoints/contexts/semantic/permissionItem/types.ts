import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  SemanticProviderMutationRunOptions,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export interface SemanticPermissionItemProviderType
  extends SemanticWorkspaceResourceProviderType<PermissionItem> {
  deleteManyByTargetId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityId(
    id: string | string[],
    opts: SemanticProviderMutationRunOptions
  ): Promise<void>;
}
