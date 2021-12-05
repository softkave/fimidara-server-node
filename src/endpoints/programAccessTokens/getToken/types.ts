import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicProgramAccessToken} from '../types';

export interface IGetProgramAccessTokenParams {
  tokenId?: string;
  onReferenced?: boolean;
}

export interface IGetProgramAccessTokenResult {
  token: IPublicProgramAccessToken;
}

export type GetProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetProgramAccessTokenParams,
  IGetProgramAccessTokenResult
>;
