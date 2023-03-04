import {IPublicCollaborationRequestForUser} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetUserCollaborationRequestEndpointParams {
  requestId: string;
}

export interface IGetUserCollaborationRequestEndpointResult {
  request: IPublicCollaborationRequestForUser;
}

export type GetUserCollaborationRequestEndpoint = Endpoint<
  IBaseContext,
  IGetUserCollaborationRequestEndpointParams,
  IGetUserCollaborationRequestEndpointResult
>;
