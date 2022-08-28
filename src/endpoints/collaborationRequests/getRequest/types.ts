import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetRequestEndpointParams {
  requestId: string;
}

export interface IGetRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type GetRequestEndpoint = Endpoint<
  IBaseContext,
  IGetRequestEndpointParams,
  IGetRequestEndpointResult
>;
