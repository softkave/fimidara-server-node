import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

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
