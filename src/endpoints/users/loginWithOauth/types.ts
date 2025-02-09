import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface LoginWithOAuthEndpointParams {
  oauthUserId: string;
  emailVerifiedAt?: number;
}

export type LoginWithOAuthEndpoint = Endpoint<
  LoginWithOAuthEndpointParams,
  LoginResult
>;
