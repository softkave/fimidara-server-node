import {IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetWorkspacePermissionGroupsEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetWorkspacePermissionGroupsEndpointResult extends IPaginatedResult {
  permissionGroups: IPublicPermissionGroup[];
}

export type GetWorkspacePermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspacePermissionGroupsEndpointParams,
  IGetWorkspacePermissionGroupsEndpointResult
>;
