import {
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetAssignedPermissionGroupsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {
  entityId: string;
  includeInheritedPermissionGroups?: boolean;
}

export interface GetAssignedPermissionGroupsEndpointParams
  extends GetAssignedPermissionGroupsEndpointParamsBase {}

export interface GetAssignedPermissionGroupsEndpointResult {
  permissionGroups: PublicPermissionGroup[];
  immediateAssignedPermissionGroupsMeta: PublicAssignedPermissionGroupMeta[];
}

export type GetAssignedPermissionGroupsEndpoint = Endpoint<
  GetAssignedPermissionGroupsEndpointParams,
  GetAssignedPermissionGroupsEndpointResult
>;
