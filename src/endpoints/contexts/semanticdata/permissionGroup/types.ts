import {IPermissionGroup} from '../../../../definitions/permissionGroups';
import {
  ISemanticDataAccessNamedResourceProvider,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessPermissionGroupProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IPermissionGroup>,
    ISemanticDataAccessNamedResourceProvider<IPermissionGroup> {}
