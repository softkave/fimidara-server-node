import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';

export type CountUserCollaborationRequestsEndpoint = Endpoint<
  BaseContextType,
  {},
  CountItemsEndpointResult
>;
