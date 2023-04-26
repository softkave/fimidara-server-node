import {
  PublicAssignedPermissionGroupMeta,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {BaseContextType} from '../../contexts/types';
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
  BaseContextType,
  GetEntityAssignedPermissionGroupsEndpointParams,
  GetEntityAssignedPermissionGroupsEndpointResult
>;
