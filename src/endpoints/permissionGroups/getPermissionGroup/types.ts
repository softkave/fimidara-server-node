import {PermissionGroupMatcher, PublicPermissionGroup} from '../../../definitions/permissionGroups';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type GetPermissionGroupEndpointParams = PermissionGroupMatcher;

export interface GetPermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type GetPermissionGroupEndpoint = Endpoint<
  BaseContext,
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult
>;
