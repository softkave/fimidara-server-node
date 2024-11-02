import {
  PermissionGroupMatcher,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups.js';
import {Endpoint} from '../../types.js';

export type GetPermissionGroupEndpointParams = PermissionGroupMatcher;

export interface GetPermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type GetPermissionGroupEndpoint = Endpoint<
  GetPermissionGroupEndpointParams,
  GetPermissionGroupEndpointResult
>;
