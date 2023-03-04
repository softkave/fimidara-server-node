import {IPermissionItem} from '../../../../definitions/permissionItem';
import {reuseableErrors} from '../../../../utils/reusableErrors';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessPermissionItemProvider} from './types';

export class MemorySemanticDataAccessPermissionItem
  extends SemanticDataAccessWorkspaceResourceProvider<IPermissionItem>
  implements ISemanticDataAccessPermissionItemProvider
{
  async deleteManyByContainerId(id: string | string[]): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteManyByEntityAndContainerId(
    entityId: string | string[],
    containerId: string | string[]
  ): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteManyByEntityId(id: string | string[]): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }

  async deleteManyByTargetId(id: string | string[]): Promise<void> {
    throw reuseableErrors.common.notImplemented();
  }
}
