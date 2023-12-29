import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticPermissionGroupProviderType} from './types';

export class DataSemanticPermissionGroup
  extends DataSemanticWorkspaceResourceProvider<PermissionGroup>
  implements SemanticPermissionGroupProviderType {}
