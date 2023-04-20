import {PermissionGroup} from '../../../../definitions/permissionGroups';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessPermissionGroupProvider} from './types';

export class MemorySemanticDataAccessPermissionGroup
  extends SemanticDataAccessWorkspaceResourceProvider<PermissionGroup>
  implements ISemanticDataAccessPermissionGroupProvider {}
