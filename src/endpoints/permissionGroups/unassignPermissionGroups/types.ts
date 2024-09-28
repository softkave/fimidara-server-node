import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface UnassignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  permissionGroupId: string | string[];
  entityId: string | string[];
}

export type UnassignPermissionGroupsEndpoint =
  Endpoint<UnassignPermissionGroupsEndpointParams>;
