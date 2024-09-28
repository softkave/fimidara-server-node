import {PublicPermissionGroup} from '../../../definitions/permissionGroups.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface NewPermissionGroupInput {
  name: string;
  description?: string;
}

export interface AddPermissionGroupEndpointParams
  extends EndpointOptionalWorkspaceIDParam,
    NewPermissionGroupInput {}

export interface AddPermissionGroupEndpointResult {
  permissionGroup: PublicPermissionGroup;
}

export type AddPermissionGroupEndpoint = Endpoint<
  AddPermissionGroupEndpointParams,
  AddPermissionGroupEndpointResult
>;
