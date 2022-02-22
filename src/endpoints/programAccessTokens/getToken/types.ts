import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

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
