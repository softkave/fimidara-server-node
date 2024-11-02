import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface CollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: number;
}

export interface SendCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam,
    CollaborationRequestInput {}

export interface SendCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type SendCollaborationRequestEndpoint = Endpoint<
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult
>;
