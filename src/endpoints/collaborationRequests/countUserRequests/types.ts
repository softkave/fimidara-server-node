import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';

export type CountUserCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  {},
  ICountItemsEndpointResult
>;
