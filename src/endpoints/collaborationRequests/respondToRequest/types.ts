import {
  CollaborationRequestResponse,
  PublicCollaborationRequestForUser,
} from '../../../definitions/collaborationRequest';
import {Endpoint} from '../../types';

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
