import {PublicPermissionGroup} from '../../../definitions/permissionGroups.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspacePermissionGroupsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspacePermissionGroupsEndpointParams
  extends GetWorkspacePermissionGroupsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspacePermissionGroupsEndpointResult extends PaginatedResult {
  permissionGroups: PublicPermissionGroup[];
}

export type GetWorkspacePermissionGroupsEndpoint = Endpoint<
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult
>;
