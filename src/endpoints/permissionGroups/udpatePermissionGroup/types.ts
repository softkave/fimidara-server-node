import {
  IPermissionGroupMatcher,
  IPublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {INewPermissionGroupInput} from '../addPermissionGroup/types';

export type IUpdatePermissionGroupInput = Partial<INewPermissionGroupInput>;

export interface IUpdatePermissionGroupEndpointParams extends IPermissionGroupMatcher {
  data: IUpdatePermissionGroupInput;
}

export interface IUpdatePermissionGroupEndpointResult {
  permissionGroup: IPublicPermissionGroup;
}

export type UpdatePermissionGroupEndpoint = Endpoint<
  IBaseContext,
  IUpdatePermissionGroupEndpointParams,
  IUpdatePermissionGroupEndpointResult
>;
