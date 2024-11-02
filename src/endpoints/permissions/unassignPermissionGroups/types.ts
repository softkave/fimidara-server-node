import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UnassignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  permissionGroupId: string | string[];
  entityId: string | string[];
}

export type UnassignPermissionGroupsEndpoint =
  Endpoint<UnassignPermissionGroupsEndpointParams>;
