import {PublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest.js';
import {Endpoint} from '../../types.js';

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
