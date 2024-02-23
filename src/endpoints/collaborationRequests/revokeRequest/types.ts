import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {Endpoint} from '../../types';

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
