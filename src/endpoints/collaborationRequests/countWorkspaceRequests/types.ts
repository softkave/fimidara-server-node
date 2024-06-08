import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceCollaborationRequestsEndpointParamsBase} from '../getWorkspaceRequests/types.js';

export type CountWorkspaceCollaborationRequestsEndpointParams =
  GetWorkspaceCollaborationRequestsEndpointParamsBase;

export type CountWorkspaceCollaborationRequestsEndpoint = Endpoint<
  CountWorkspaceCollaborationRequestsEndpointParams,
  CountItemsEndpointResult
>;
