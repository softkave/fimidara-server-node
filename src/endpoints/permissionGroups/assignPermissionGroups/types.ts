import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface AssignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  permissionGroups: AssignPermissionGroupInput[];
  entityId: string | string[];
}

export type AssignPermissionGroupsEndpoint =
  Endpoint<AssignPermissionGroupsEndpointParams>;
