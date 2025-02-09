import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface SignupWithOAuthEndpointParams {
  name: string;
  email: string;
  emailVerifiedAt?: number;
  oauthUserId: string;
}

export type SignupWithOAuthEndpoint = Endpoint<
  SignupWithOAuthEndpointParams,
  LoginResult
>;
