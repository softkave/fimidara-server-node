import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';

export type CountUserCollaborationRequestsEndpoint = Endpoint<
  BaseContext,
  {},
  CountItemsEndpointResult
>;
