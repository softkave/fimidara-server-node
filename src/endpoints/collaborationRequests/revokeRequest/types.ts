import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest.js';
import {Endpoint} from '../../types.js';

export interface RevokeCollaborationRequestEndpointParams {
  requestId: string;
}

export interface RevokeCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type RevokeCollaborationRequestEndpoint = Endpoint<
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult
>;
