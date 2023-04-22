import {PublicAgentToken} from '../../../definitions/agentToken';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface GetWorkspaceAgentTokensEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspaceAgentTokensEndpointParams
  extends GetWorkspaceAgentTokensEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceAgentTokensEndpointResult extends PaginatedResult {
  tokens: PublicAgentToken[];
}

export type GetWorkspaceAgentTokensEndpoint = Endpoint<
  BaseContextType,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult
>;
