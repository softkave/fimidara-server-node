import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceClientAssignedTokensEndpointParamsBase} from '../getWorkspaceTokens/types';

export type ICountWorkspaceClientAssignedTokensEndpointParams =
  IGetWorkspaceClientAssignedTokensEndpointParamsBase;

export type CountWorkspaceClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceClientAssignedTokensEndpointParams,
  ICountItemsEndpointResult
>;
