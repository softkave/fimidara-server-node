import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface CollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: number;
}

export interface SendCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIDParam,
    CollaborationRequestInput {}

export interface SendCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type SendCollaborationRequestEndpoint = Endpoint<
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult
>;
