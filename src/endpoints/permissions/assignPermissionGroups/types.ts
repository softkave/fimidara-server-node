import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface AssignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  permissionGroupId: string | string[];
  entityId: string | string[];
}

export type AssignPermissionGroupsEndpoint =
  Endpoint<AssignPermissionGroupsEndpointParams>;
