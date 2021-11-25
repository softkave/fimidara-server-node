import {CollaborationRequestResponse} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface IRespondToRequestParams {
  requestId: string;
  response: CollaborationRequestResponse;
}

export interface IRespondToRequestResult {
  request: IPublicCollaborationRequest;
}

export type RespondToRequestEndpoint = Endpoint<
  IBaseContext,
  IRespondToRequestParams,
  IRespondToRequestResult
>;
