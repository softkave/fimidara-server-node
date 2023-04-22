import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessPermissionGroupProviderType} from './types';

export class MemorySemanticDataAccessPermissionGroup
  extends SemanticDataAccessWorkspaceResourceProvider<PermissionGroup>
  implements SemanticDataAccessPermissionGroupProviderType {}
