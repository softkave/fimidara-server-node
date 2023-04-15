import {IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface INewPermissionGroupInput {
  name: string;
  description?: string;
}

export interface IAddPermissionGroupEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  permissionGroup: INewPermissionGroupInput;
}

export interface IAddPermissionGroupEndpointResult {
  permissionGroup: IPublicPermissionGroup;
}

export type AddPermissionGroupEndpoint = Endpoint<
  IBaseContext,
  IAddPermissionGroupEndpointParams,
  IAddPermissionGroupEndpointResult
>;
