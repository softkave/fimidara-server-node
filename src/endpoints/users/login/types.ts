import {PublicUser} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';

export interface LoginEndpointParams {
  email: string;
  password: string;
}

export interface LoginResult {
  user: PublicUser;
  jwtToken: string;
  refreshToken: string;
  clientJwtToken: string;
  jwtTokenExpiresAt: number;
}

export type LoginEndpoint = Endpoint<LoginEndpointParams, LoginResult>;
