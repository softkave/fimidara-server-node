import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetAgentTokensEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetAgentTokensEndpointParams
  extends GetAgentTokensEndpointParamsBase,
    PaginationQuery {
  shouldEncode?: boolean;
}

export interface GetAgentTokensEndpointResult extends PaginatedResult {
  tokens: PublicAgentToken[];
}

export type GetAgentTokensEndpoint = Endpoint<
  GetAgentTokensEndpointParams,
  GetAgentTokensEndpointResult
>;
