import {IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetWorkspacePermissionGroupsEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspacePermissionGroupsEndpointResult {
  permissionGroups: IPublicPermissionGroup[];
}

export type GetWorkspacePermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspacePermissionGroupsEndpointParams,
  IGetWorkspacePermissionGroupsEndpointResult
>;
