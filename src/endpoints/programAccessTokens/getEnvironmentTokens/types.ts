import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicProgramAccessToken} from '../types';

export interface IGetEnvironmentProgramAccessTokensParams {
  environmentId: string;
}

export interface IGetEnvironmentProgramAccessTokensResult {
  tokens: IPublicProgramAccessToken[];
}

export type GetEnvironmentProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetEnvironmentProgramAccessTokensParams,
  IGetEnvironmentProgramAccessTokensResult
>;
