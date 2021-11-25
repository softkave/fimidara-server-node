import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface IRevokeRequestParams {
  requestId: string;
}

export interface IRevokeRequestResult {
  request: IPublicCollaborationRequest;
}

export type RevokeRequestEndpoint = Endpoint<
  IBaseContext,
  IRevokeRequestParams,
  IRevokeRequestResult
>;
