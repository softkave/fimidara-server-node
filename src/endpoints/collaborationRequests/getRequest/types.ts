import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetCollaborationRequestEndpointParams {
  requestId: string;
}

export interface IGetCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type GetCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IGetCollaborationRequestEndpointParams,
  IGetCollaborationRequestEndpointResult
>;
