import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface IGetUserRequestsResult {
  requests: IPublicCollaborationRequest[];
}

export type GetUserRequestsEndpoint = Endpoint<
  IBaseContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  IGetUserRequestsResult
>;
