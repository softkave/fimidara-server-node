import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface IGetRequestParams {
  requestId: string;
}

export interface IGetRequestResult {
  request: IPublicCollaborationRequest;
}

export type GetRequestEndpoint = Endpoint<
  IBaseContext,
  IGetRequestParams,
  IGetRequestResult
>;
