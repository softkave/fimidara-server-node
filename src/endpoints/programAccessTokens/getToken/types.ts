import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IGetProgramAccessTokenEndpointParams {
  tokenId?: string;
  onReferenced?: boolean;
}

export interface IGetProgramAccessTokenEndpointResult {
  token: IPublicProgramAccessToken;
}

export type GetProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IGetProgramAccessTokenEndpointParams,
  IGetProgramAccessTokenEndpointResult
>;
