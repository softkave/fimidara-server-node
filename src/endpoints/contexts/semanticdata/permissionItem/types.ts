import {IPermissionItem} from '../../../../definitions/permissionItem';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessPermissionItemProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IPermissionItem> {
  deleteManyByTargetId(id: string | string[]): Promise<void>;
  deleteManyByContainerId(id: string | string[]): Promise<void>;
  deleteManyByEntityId(id: string | string[]): Promise<void>;
}
