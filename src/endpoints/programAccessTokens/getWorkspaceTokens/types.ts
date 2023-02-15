import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetWorkspaceProgramAccessTokensEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {}

export interface IGetWorkspaceProgramAccessTokensEndpointParams
  extends IGetWorkspaceProgramAccessTokensEndpointParamsBase,
    IPaginationQuery {}

export interface IGetWorkspaceProgramAccessTokensEndpointResult extends IPaginatedResult {
  tokens: IPublicProgramAccessToken[];
}

export type GetWorkspaceProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceProgramAccessTokensEndpointParams,
  IGetWorkspaceProgramAccessTokensEndpointResult
>;
