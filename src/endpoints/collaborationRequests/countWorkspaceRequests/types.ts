import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceCollaborationRequestsEndpointParamsBase} from '../getWorkspaceRequests/types';

export type ICountWorkspaceCollaborationRequestsEndpointParams =
  IGetWorkspaceCollaborationRequestsEndpointParamsBase;

export type CountWorkspaceCollaborationRequestsEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceCollaborationRequestsEndpointParams,
  ICountItemsEndpointResult
>;
