import {PermissionItem} from '../../../../definitions/permissionItem';
import {
  ISemanticDataAccessWorkspaceResourceProvider,
  SemanticDataAccessProviderMutationRunOptions,
} from '../types';

export interface ISemanticDataAccessPermissionItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<PermissionItem> {
  deleteManyByTargetId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityId(
    id: string | string[],
    opts: SemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
