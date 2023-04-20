import {PublicAgentToken} from '../../../definitions/agentToken';
import {BaseContext} from '../../contexts/types';
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

export type GetWorkspaceAgentTokenEndpoint = Endpoint<
  BaseContext,
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult
>;
