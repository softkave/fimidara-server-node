import {PublicCollaborator} from '../../../definitions/user.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspaceCollaboratorsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetWorkspaceCollaboratorsEndpointParams
  extends GetWorkspaceCollaboratorsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceCollaboratorsEndpointResult
  extends PaginatedResult {
  collaborators: PublicCollaborator[];
}

export type GetWorkspaceCollaboratorsEndpoint = Endpoint<
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult
>;
