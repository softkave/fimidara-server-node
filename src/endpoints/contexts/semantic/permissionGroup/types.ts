import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {SemanticDataAccessWorkspaceResourceProviderType} from '../types';

export interface SemanticDataAccessPermissionGroupProviderType<TTxn>
  extends SemanticDataAccessWorkspaceResourceProviderType<PermissionGroup, TTxn> {}
