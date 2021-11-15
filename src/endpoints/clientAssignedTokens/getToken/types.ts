import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicClientAssignedToken} from '../types';

export interface IGetClientAssignedTokenParams {
  tokenId: string;
}

export interface IGetClientAssignedTokenResult {
  token: IPublicClientAssignedToken;
}

export type GetClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IGetClientAssignedTokenParams,
  IGetClientAssignedTokenResult
>;
