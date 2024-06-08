import {
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface GetEntityAssignedPermissionGroupsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {
  entityId: string;
  includeInheritedPermissionGroups?: boolean;
}

export interface GetEntityAssignedPermissionGroupsEndpointParams
  extends GetEntityAssignedPermissionGroupsEndpointParamsBase {}

export interface GetEntityAssignedPermissionGroupsEndpointResult {
  permissionGroups: PublicPermissionGroup[];
  immediateAssignedPermissionGroupsMeta: PublicAssignedPermissionGroupMeta[];
}

export type GetEntityAssignedPermissionGroupsEndpoint = Endpoint<
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointResult
>;
