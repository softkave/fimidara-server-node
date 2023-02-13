import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';

export interface ICountUserCollaborationRequestsEndpointParams {}

export type CountUserCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  ICountUserCollaborationRequestsEndpointParams,
  ICountItemsEndpointResult
>;
