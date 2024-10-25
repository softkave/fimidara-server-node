import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface RefreshUserTokenEndpointParams {
  refreshToken: string;
}

export type RefreshUserTokenEndpoint = Endpoint<
  RefreshUserTokenEndpointParams,
  LoginResult
>;
