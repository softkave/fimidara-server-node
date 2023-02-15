import {IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetEntityAssignedPermissionGroupsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetEntityAssignedPermissionGroupsEndpointParams
  extends IGetEntityAssignedPermissionGroupsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetEntityAssignedPermissionGroupsEndpointResult extends IPaginatedResult {
  permissionGroups: IPublicPermissionGroup[];
}

export type GetEntityAssignedPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityAssignedPermissionGroupsEndpointParams,
  IGetEntityAssignedPermissionGroupsEndpointResult
>;
