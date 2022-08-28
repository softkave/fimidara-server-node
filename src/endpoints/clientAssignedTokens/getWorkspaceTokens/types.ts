import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetWorkspaceClientAssignedTokensEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspaceClientAssignedTokensEndpointResult {
  tokens: IPublicClientAssignedToken[];
}

export type GetWorkspaceClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceClientAssignedTokensEndpointParams,
  IGetWorkspaceClientAssignedTokensEndpointResult
>;
