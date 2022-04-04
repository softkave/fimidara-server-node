import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetUserRequestsEndpointResult {
  requests: IPublicCollaborationRequest[];
}

export type GetUserRequestsEndpoint = Endpoint<
  IBaseContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  IGetUserRequestsEndpointResult
>;
