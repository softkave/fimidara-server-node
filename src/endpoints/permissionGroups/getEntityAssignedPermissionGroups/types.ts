import {IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetEntityAssignedPermissionGroupsEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetEntityAssignedPermissionGroupsEndpointResult extends IPaginatedResult {
  permissionGroups: IPublicPermissionGroup[];
}

export type GetEntityAssignedPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityAssignedPermissionGroupsEndpointParams,
  IGetEntityAssignedPermissionGroupsEndpointResult
>;
