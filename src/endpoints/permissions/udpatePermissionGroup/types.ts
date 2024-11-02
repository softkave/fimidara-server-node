import {
  PermissionGroupMatcher,
  PublicPermissionGroup,
} from '../../../definitions/permissionGroups.js';
import {Endpoint} from '../../types.js';
import {NewPermissionGroupInput} from '../addPermissionGroup/types.js';

export type UpdatePermissionGroupInput = Partial<NewPermissionGroupInput>;

export interface UpdatePermissionGroupEndpointParams extends PermissionGroupMatcher {
  data: UpdatePermissionGroupInput;
}

export interface UpdatePermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type UpdatePermissionGroupEndpoint = Endpoint<
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult
>;
