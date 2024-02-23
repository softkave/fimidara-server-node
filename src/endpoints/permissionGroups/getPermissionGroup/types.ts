import {
  PermissionGroupMatcher,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {Endpoint} from '../../types';

export type GetPermissionGroupEndpointParams = PermissionGroupMatcher;

export interface GetPermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type GetPermissionGroupEndpoint = Endpoint<
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult
>;
