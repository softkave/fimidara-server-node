import {BaseContextType} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspaceAgentTokensEndpointParamsBase} from '../getWorkspaceTokens/types';

export type CountWorkspaceAgentTokensEndpointParams = GetWorkspaceAgentTokensEndpointParamsBase;

export type CountWorkspaceAgentTokensEndpoint = Endpoint<
  BaseContextType,
  CountWorkspaceAgentTokensEndpointParams,
  CountItemsEndpointResult
>;
