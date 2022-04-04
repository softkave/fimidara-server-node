import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface ICollaborationRequestInput {
  recipientEmail: string;
  message: string;
  expires?: string;
}

export interface ISendRequestEndpointParams {
  organizationId: string;
  request: ICollaborationRequestInput;
}

export interface ISendRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type SendRequestEndpoint = Endpoint<
  IBaseContext,
  ISendRequestEndpointParams,
  ISendRequestEndpointResult
>;
