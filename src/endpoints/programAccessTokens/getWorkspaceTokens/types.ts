import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetWorkspaceProgramAccessTokensEndpointParams extends IPaginationQuery {
  workspaceId?: string;
}

export interface IGetWorkspaceProgramAccessTokensEndpointResult extends IPaginatedResult {
  tokens: IPublicProgramAccessToken[];
}

export type GetWorkspaceProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceProgramAccessTokensEndpointParams,
  IGetWorkspaceProgramAccessTokensEndpointResult
>;
