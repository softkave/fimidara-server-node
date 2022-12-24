import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetUserCollaborationRequestsEndpointResult {
  requests: IPublicCollaborationRequest[];
}

export type GetUserCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  IGetUserCollaborationRequestsEndpointResult
>;
