import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {Endpoint} from '../../types';

export interface GetUserCollaborationRequestEndpointParams {
  requestId: string;
}

export interface GetUserCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForUser;
}

export type GetUserCollaborationRequestEndpoint = Endpoint<
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult
>;
