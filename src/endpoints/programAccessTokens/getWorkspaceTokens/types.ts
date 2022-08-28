import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetWorkspaceProgramAccessTokensEndpointParams {
  workspaceId?: string;
}

export interface IGetWorkspaceProgramAccessTokensEndpointResult {
  tokens: IPublicProgramAccessToken[];
}

export type GetWorkspaceProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceProgramAccessTokensEndpointParams,
  IGetWorkspaceProgramAccessTokensEndpointResult
>;
