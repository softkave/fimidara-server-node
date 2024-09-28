import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface AssignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  permissionGroupId: string | string[];
  entityId: string | string[];
}

export type AssignPermissionGroupsEndpoint =
  Endpoint<AssignPermissionGroupsEndpointParams>;
