import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetCollaboratorsWithoutPermissionEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetCollaboratorsWithoutPermissionEndpointParams
  extends GetCollaboratorsWithoutPermissionEndpointParamsBase {}

export interface GetCollaboratorsWithoutPermissionEndpointResult {
  collaboratorIds: string[];
}

export type GetCollaboratorsWithoutPermissionEndpoint = Endpoint<
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult
>;
