import {IPublicAgentToken} from '../../../definitions/agentToken';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspaceAgentTokensEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspaceAgentTokensEndpointParams
  extends IGetWorkspaceAgentTokensEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceAgentTokensEndpointResult extends IPaginatedResult {
  tokens: IPublicAgentToken[];
}

export type GetWorkspaceAgentTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceAgentTokensEndpointParams,
  IGetWorkspaceAgentTokensEndpointResult
>;
