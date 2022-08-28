import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IRevokeRequestEndpointParams {
  requestId: string;
}

export interface IRevokeRequestEndpointResult {
  request: IPublicCollaborationRequest;
}

export type RevokeRequestEndpoint = Endpoint<
  IBaseContext,
  IRevokeRequestEndpointParams,
  IRevokeRequestEndpointResult
>;
