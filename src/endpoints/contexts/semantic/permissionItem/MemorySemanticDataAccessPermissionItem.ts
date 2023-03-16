import {IPermissionItem} from '../../../../definitions/permissionItem';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {ISemanticDataAccessProviderMutationRunOptions} from '../types';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessPermissionItemProvider} from './types';

export class MemorySemanticDataAccessPermissionItem
  extends SemanticDataAccessWorkspaceResourceProvider<IPermissionItem>
  implements ISemanticDataAccessPermissionItemProvider
{
  async deleteManyByContainerId(
    id: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteManyByEntityAndContainerId(
    entityId: string | string[],
    containerId: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteManyByEntityId(
    id: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteManyByTargetId(
    id: string | string[],
    opts: ISemanticDataAccessProviderMutationRunOptions
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }
}
