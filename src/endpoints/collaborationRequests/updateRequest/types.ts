import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface IUpdateCollaborationRequestInput {
  message?: string;
  expiresAtInSecsFromToday?: number;
}

export interface IUpdateRequestParams {
  requestId: string;
  request: IUpdateCollaborationRequestInput;
}

export interface IUpdateRequestResult {
  request: IPublicCollaborationRequest;
}

export type UpdateRequestEndpoint = Endpoint<
  IBaseContext,
  IUpdateRequestParams,
  IUpdateRequestResult
>;
