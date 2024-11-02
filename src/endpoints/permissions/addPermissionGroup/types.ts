import {PublicPermissionGroup} from '../../../definitions/permissionGroups.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface NewPermissionGroupInput {
  name: string;
  description?: string;
}

export interface AddPermissionGroupEndpointParams
  extends EndpointOptionalWorkspaceIdParam,
    NewPermissionGroupInput {}

export interface AddPermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type AddPermissionGroupEndpoint = Endpoint<
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult
>;
