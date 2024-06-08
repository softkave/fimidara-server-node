import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspaceAgentTokensEndpointParamsBase} from '../getWorkspaceTokens/types.js';

export type CountWorkspaceAgentTokensEndpointParams =
  GetWorkspaceAgentTokensEndpointParamsBase;

export type CountWorkspaceAgentTokensEndpoint = Endpoint<
  CountWorkspaceAgentTokensEndpointParams,
  CountItemsEndpointResult
>;
