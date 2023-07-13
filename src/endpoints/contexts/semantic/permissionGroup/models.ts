import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {DataSemanticDataAccessWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticDataAccessPermissionGroupProviderType} from './types';

export class DataSemanticDataAccessPermissionGroup
  extends DataSemanticDataAccessWorkspaceResourceProvider<PermissionGroup>
  implements SemanticDataAccessPermissionGroupProviderType {}
