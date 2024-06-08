import {
  CollaborationRequestResponse,
  PublicCollaborationRequestForUser,
} from '../../../definitions/collaborationRequest.js';
import {Endpoint} from '../../types.js';

export interface RespondToCollaborationRequestEndpointParams {
  requestId: string;
  response: CollaborationRequestResponse;
}

export interface RespondToCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForUser;
}

export type RespondToCollaborationRequestEndpoint = Endpoint<
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult
>;
