import {
  CollaborationRequestResponse,
  IPublicCollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IRespondToRequestEndpointParams {
  requestId: string;
  response: CollaborationRequestResponse;
}

export interface IRespondToRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type RespondToRequestEndpoint = Endpoint<
  IBaseContext,
  IRespondToRequestEndpointParams,
  IRespondToRequestEndpointResult
>;
