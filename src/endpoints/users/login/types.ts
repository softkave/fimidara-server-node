import {PublicUser} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';

export interface LoginEndpointParams {
  email: string;
  password: string;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
  clientAssignedToken: string;
}

export type LoginEndpoint = Endpoint<LoginEndpointParams, LoginResult>;
