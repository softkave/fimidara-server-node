import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetCollaborationRequestsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetCollaborationRequestsEndpointParams
  extends GetCollaborationRequestsEndpointParamsBase,
    PaginationQuery {}

export interface GetCollaborationRequestsEndpointResult
  extends PaginatedResult {
  requests: PublicCollaborationRequestForWorkspace[];
}

export type GetCollaborationRequestsEndpoint = Endpoint<
  GetCollaborationRequestsEndpointParams,
  GetCollaborationRequestsEndpointResult
>;
