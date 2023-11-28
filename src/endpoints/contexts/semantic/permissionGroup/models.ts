import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticWorkspaceResourceProvider';
import {SemanticPermissionGroupProviderType} from './types';

export class DataSemanticPermissionGroup
  extends DataSemanticWorkspaceResourceProvider<PermissionGroup>
  implements SemanticPermissionGroupProviderType {}
