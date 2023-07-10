import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {MemorySemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessPermissionGroupProviderType} from './types';

export class MemorySemanticDataAccessPermissionGroup
  extends MemorySemanticDataAccessWorkspaceResourceProvider<PermissionGroup>
  implements SemanticDataAccessPermissionGroupProviderType {}
