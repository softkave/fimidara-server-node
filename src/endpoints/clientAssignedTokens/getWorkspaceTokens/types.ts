import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspaceClientAssignedTokensEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspaceClientAssignedTokensEndpointParams
  extends IGetWorkspaceClientAssignedTokensEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceClientAssignedTokensEndpointResult extends IPaginatedResult {
  tokens: IPublicClientAssignedToken[];
}

export type GetWorkspaceClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceClientAssignedTokensEndpointParams,
  IGetWorkspaceClientAssignedTokensEndpointResult
>;
