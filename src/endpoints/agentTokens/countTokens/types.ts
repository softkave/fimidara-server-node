import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetAgentTokensEndpointParamsBase} from '../getTokens/types.js';

export type CountAgentTokensEndpointParams = GetAgentTokensEndpointParamsBase;

export type CountAgentTokensEndpoint = Endpoint<
  CountAgentTokensEndpointParams,
  CountItemsEndpointResult
>;
