import {IPublicCollaborationRequestForWorkspace} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IRevokeCollaborationRequestEndpointParams {
  requestId: string;
}

export interface IRevokeCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequestForWorkspace;
}

export type RevokeCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IRevokeCollaborationRequestEndpointParams,
  IRevokeCollaborationRequestEndpointResult
>;
