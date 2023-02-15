import {IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspacePermissionGroupsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspacePermissionGroupsEndpointParams
  extends IGetWorkspacePermissionGroupsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspacePermissionGroupsEndpointResult extends IPaginatedResult {
  permissionGroups: IPublicPermissionGroup[];
}

export type GetWorkspacePermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspacePermissionGroupsEndpointParams,
  IGetWorkspacePermissionGroupsEndpointResult
>;
