import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspaceCollaborationRequestsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetWorkspaceCollaborationRequestsEndpointParams
  extends GetWorkspaceCollaborationRequestsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceCollaborationRequestsEndpointResult
  extends PaginatedResult {
  requests: PublicCollaborationRequestForWorkspace[];
}

export type GetWorkspaceCollaborationRequestsEndpoint = Endpoint<
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult
>;
