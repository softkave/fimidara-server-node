import {
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

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
