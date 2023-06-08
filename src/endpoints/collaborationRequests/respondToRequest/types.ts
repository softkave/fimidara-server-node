import {
  CollaborationRequestResponse,
  PublicCollaborationRequestForUser,
} from '../../../definitions/collaborationRequest';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface RespondToCollaborationRequestEndpointParams {
  requestId: string;
  response: CollaborationRequestResponse;
}

export interface RespondToCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForUser;
}

export type RespondToCollaborationRequestEndpoint = Endpoint<
  BaseContextType,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult
>;
