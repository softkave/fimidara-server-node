import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types';

export interface GetUserCollaborationRequestsEndpointParams extends PaginationQuery {}

export interface GetUserCollaborationRequestsEndpointResult extends PaginatedResult {
  requests: PublicCollaborationRequestForUser[];
}

export type GetUserCollaborationRequestsEndpoint = Endpoint<
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult
>;
