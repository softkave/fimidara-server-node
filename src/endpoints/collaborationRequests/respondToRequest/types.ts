import {
  CollaborationRequestResponse,
  PublicCollaborationRequestForUser,
} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface RespondToCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
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
