import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspaceAgentTokensEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspaceAgentTokensEndpointParams
  extends GetWorkspaceAgentTokensEndpointParamsBase,
    PaginationQuery {
  shouldEncode?: boolean;
}

export interface GetWorkspaceAgentTokensEndpointResult extends PaginatedResult {
  tokens: PublicAgentToken[];
}

export type GetWorkspaceAgentTokensEndpoint = Endpoint<
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult
>;
