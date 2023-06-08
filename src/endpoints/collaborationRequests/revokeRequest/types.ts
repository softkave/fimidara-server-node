import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface RevokeCollaborationRequestEndpointParams {
  requestId: string;
}

export interface RevokeCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type RevokeCollaborationRequestEndpoint = Endpoint<
  BaseContextType,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult
>;
