import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicProgramAccessToken} from '../types';

export interface IGetProgramAccessTokenParams {
  tokenId: string;
}

export interface IGetProgramAccessTokenResult {
  token: IPublicProgramAccessToken;
}

export type GetProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetProgramAccessTokenParams,
  IGetProgramAccessTokenResult
>;
