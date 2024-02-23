import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetCollaboratorsWithoutPermissionEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetCollaboratorsWithoutPermissionEndpointParams
  extends GetCollaboratorsWithoutPermissionEndpointParamsBase {}

export interface GetCollaboratorsWithoutPermissionEndpointResult {
  collaboratorIds: string[];
}

export type GetCollaboratorsWithoutPermissionEndpoint = Endpoint<
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult
>;
