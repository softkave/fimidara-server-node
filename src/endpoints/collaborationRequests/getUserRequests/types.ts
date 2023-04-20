import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {BaseContext} from '../../contexts/types';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types';

export interface GetUserCollaborationRequestsEndpointParams extends PaginationQuery {}

export interface GetUserCollaborationRequestsEndpointResult extends PaginatedResult {
  requests: PublicCollaborationRequestForUser[];
}

export type GetUserCollaborationRequestsEndpoint = Endpoint<
  BaseContext,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult
>;
