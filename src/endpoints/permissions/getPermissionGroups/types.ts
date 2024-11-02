import {PublicPermissionGroup} from '../../../definitions/permissionGroups.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetPermissionGroupsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetPermissionGroupsEndpointParams
  extends GetPermissionGroupsEndpointParamsBase,
    PaginationQuery {}

export interface GetPermissionGroupsEndpointResult extends PaginatedResult {
  permissionGroups: PublicPermissionGroup[];
}

export type GetPermissionGroupsEndpoint = Endpoint<
  GetPermissionGroupsEndpointParams,
  GetPermissionGroupsEndpointResult
>;
