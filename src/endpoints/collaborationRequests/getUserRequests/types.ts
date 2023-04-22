import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types';

export interface GetUserCollaborationRequestsEndpointParams extends PaginationQuery {}

export interface GetUserCollaborationRequestsEndpointResult extends PaginatedResult {
  requests: PublicCollaborationRequestForUser[];
}

export type GetUserCollaborationRequestsEndpoint = Endpoint<
  BaseContextType,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult
>;
