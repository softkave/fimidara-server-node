import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface ICollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expiresAtInSecsFromToday?: number;
}

export interface ISendRequestParams {
  organizationId: string;
  request: ICollaborationRequestInput;
}

export interface ISendRequestResult {
  request: IPublicCollaborationRequest;
}

export type SendRequestEndpoint = Endpoint<
  IBaseContext,
  ISendRequestParams,
  ISendRequestResult
>;
