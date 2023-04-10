import {IPublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetUserCollaborationRequestsEndpointParams extends IPaginationQuery {}

export interface IGetUserCollaborationRequestsEndpointResult extends IPaginatedResult {
  requests: IPublicCollaborationRequestForUser[];
}

export type GetUserCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetUserCollaborationRequestsEndpointParams,
  IGetUserCollaborationRequestsEndpointResult
>;
