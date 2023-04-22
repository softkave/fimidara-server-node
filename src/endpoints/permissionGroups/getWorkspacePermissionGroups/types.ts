import {PublicPermissionGroup} from '../../../definitions/permissionGroups';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface GetWorkspacePermissionGroupsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspacePermissionGroupsEndpointParams
  extends GetWorkspacePermissionGroupsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspacePermissionGroupsEndpointResult extends PaginatedResult {
  permissionGroups: PublicPermissionGroup[];
}

export type GetWorkspacePermissionGroupsEndpoint = Endpoint<
  BaseContextType,
  GetWorkspacePermissionGroupsEndpointParams,
  GetWorkspacePermissionGroupsEndpointResult
>;
