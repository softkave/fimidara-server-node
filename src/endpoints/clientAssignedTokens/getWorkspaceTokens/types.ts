import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetWorkspaceClientAssignedTokensEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetWorkspaceClientAssignedTokensEndpointResult extends IPaginatedResult {
  tokens: IPublicClientAssignedToken[];
}

export type GetWorkspaceClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceClientAssignedTokensEndpointParams,
  IGetWorkspaceClientAssignedTokensEndpointResult
>;
