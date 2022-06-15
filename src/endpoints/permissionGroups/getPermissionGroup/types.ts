import {
  IPermissionGroupMatcher,
  IPublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export type IGetPermissionGroupEndpointParams = IPermissionGroupMatcher;

export interface IGetPermissionGroupEndpointResult {
  permissionGroup: IPublicPermissionGroup;
}

export type GetPermissionGroupEndpoint = Endpoint<
  IBaseContext,
  IGetPermissionGroupEndpointParams,
  IGetPermissionGroupEndpointResult
>;