import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface UnassignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  permissionGroups: string | string[];
  entityId: string | string[];
}

export type UnassignPermissionGroupsEndpoint =
  Endpoint<UnassignPermissionGroupsEndpointParams>;
