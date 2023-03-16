import {IPermissionItem} from '../../../../definitions/permissionItem';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessPermissionItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IPermissionItem> {
  deleteManyByTargetId(
    id: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByContainerId(
    id: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityId(
    id: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
  deleteManyByEntityAndContainerId(
    entityId: string | string[],
    containerId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void>;
}
