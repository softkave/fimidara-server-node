import {PublicCollaborator} from '../../../definitions/user.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetCollaboratorsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetCollaboratorsEndpointParams
  extends GetCollaboratorsEndpointParamsBase,
    PaginationQuery {}

export interface GetCollaboratorsEndpointResult extends PaginatedResult {
  collaborators: PublicCollaborator[];
}

export type GetCollaboratorsEndpoint = Endpoint<
  GetCollaboratorsEndpointParams,
  GetCollaboratorsEndpointResult
>;
