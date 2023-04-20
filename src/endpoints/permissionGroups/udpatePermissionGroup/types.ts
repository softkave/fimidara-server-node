import {PermissionGroupMatcher, PublicPermissionGroup} from '../../../definitions/permissionGroups';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {NewPermissionGroupInput} from '../addPermissionGroup/types';

export type UpdatePermissionGroupInput = Partial<NewPermissionGroupInput>;

export interface UpdatePermissionGroupEndpointParams extends PermissionGroupMatcher {
  data: UpdatePermissionGroupInput;
}

export interface UpdatePermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type UpdatePermissionGroupEndpoint = Endpoint<
  BaseContext,
  UpdatePermissionGroupEndpointParams,
  UpdatePermissionGroupEndpointResult
>;
