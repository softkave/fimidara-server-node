import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspaceCollaborationRequestsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspaceCollaborationRequestsEndpointParams
  extends GetWorkspaceCollaborationRequestsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceCollaborationRequestsEndpointResult extends PaginatedResult {
  requests: PublicCollaborationRequestForWorkspace[];
}

export type GetWorkspaceCollaborationRequestsEndpoint = Endpoint<
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult
>;
