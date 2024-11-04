import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface RevokeCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  requestId: string;
}

export interface RevokeCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type RevokeCollaborationRequestEndpoint = Endpoint<
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult
>;
