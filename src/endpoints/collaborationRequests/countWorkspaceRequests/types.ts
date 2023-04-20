import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceCollaborationRequestsEndpointParamsBase} from '../getWorkspaceRequests/types';

export type CountWorkspaceCollaborationRequestsEndpointParams =
  GetWorkspaceCollaborationRequestsEndpointParamsBase;

export type CountWorkspaceCollaborationRequestsEndpoint = Endpoint<
  BaseContext,
  CountWorkspaceCollaborationRequestsEndpointParams,
  CountItemsEndpointResult
>;
