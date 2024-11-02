import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspaceAgentTokensEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

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
