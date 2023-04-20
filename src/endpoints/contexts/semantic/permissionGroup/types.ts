import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {ISemanticDataAccessWorkspaceResourceProvider} from '../types';

export interface ISemanticDataAccessPermissionGroupProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<PermissionGroup> {}
