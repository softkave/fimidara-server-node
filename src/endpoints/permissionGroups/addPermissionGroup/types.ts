import {PublicPermissionGroup} from '../../../definitions/permissionGroups';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface NewPermissionGroupInput {
  name: string;
  description?: string;
}

export interface AddPermissionGroupEndpointParams extends EndpointOptionalWorkspaceIDParam {
  permissionGroup: NewPermissionGroupInput;
}

export interface AddPermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type AddPermissionGroupEndpoint = Endpoint<
  BaseContext,
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult
>;
