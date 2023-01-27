import {CollaborationRequestResponse, IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IRespondToCollaborationRequestEndpointParams {
  requestId: string;
  response: CollaborationRequestResponse;
}

export interface IRespondToCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type RespondToCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IRespondToCollaborationRequestEndpointParams,
  IRespondToCollaborationRequestEndpointResult
>;
