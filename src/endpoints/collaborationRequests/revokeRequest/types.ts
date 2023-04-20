import {PublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface RevokeCollaborationRequestEndpointParams {
  requestId: string;
}

export interface RevokeCollaborationRequestEndpointResult {
  request: PublicCollaborationRequestForWorkspace;
}

export type RevokeCollaborationRequestEndpoint = Endpoint<
  BaseContext,
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult
>;
