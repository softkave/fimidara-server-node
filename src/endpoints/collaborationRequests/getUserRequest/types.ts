import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetUserCollaborationRequestEndpointParams {
  requestId: string;
}

export interface GetUserCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForUser;
}

export type GetUserCollaborationRequestEndpoint = Endpoint<
  BaseContext,
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult
>;
