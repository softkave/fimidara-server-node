import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetCollaborationRequestsEndpointParamsBase} from '../getRequests/types.js';

export type CountCollaborationRequestsEndpointParams =
  GetCollaborationRequestsEndpointParamsBase;

export type CountCollaborationRequestsEndpoint = Endpoint<
  CountCollaborationRequestsEndpointParams,
  CountItemsEndpointResult
>;
