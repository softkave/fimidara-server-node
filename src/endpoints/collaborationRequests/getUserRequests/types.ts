import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest.js';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types.js';

export interface GetUserCollaborationRequestsEndpointParams extends PaginationQuery {}

export interface GetUserCollaborationRequestsEndpointResult extends PaginatedResult {
  requests: PublicCollaborationRequestForUser[];
}

export type GetUserCollaborationRequestsEndpoint = Endpoint<
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult
>;
