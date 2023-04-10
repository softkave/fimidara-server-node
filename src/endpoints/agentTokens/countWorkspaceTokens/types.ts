import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceAgentTokensEndpointParamsBase} from '../getWorkspaceTokens/types';

export type ICountWorkspaceAgentTokensEndpointParams = IGetWorkspaceAgentTokensEndpointParamsBase;

export type GetWorkspaceAgentTokenEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceAgentTokensEndpointParams,
  ICountItemsEndpointResult
>;
