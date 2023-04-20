import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface CollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: number;
}

export interface SendCollaborationRequestEndpointParams extends EndpointOptionalWorkspaceIDParam {
  request: CollaborationRequestInput;
}

export interface SendCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type SendCollaborationRequestEndpoint = Endpoint<
  BaseContext,
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult
>;
