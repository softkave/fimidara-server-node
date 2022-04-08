import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateCollaborationRequestInput {
  message?: string;
  expires?: string;
}

export interface IUpdateRequestEndpointParams {
  requestId: string;
  request: IUpdateCollaborationRequestInput;
}

export interface IUpdateRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type UpdateRequestEndpoint = Endpoint<
  IBaseContext,
  IUpdateRequestEndpointParams,
  IUpdateRequestEndpointResult
>;
