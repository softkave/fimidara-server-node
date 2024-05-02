import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface SignupEndpointParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type SignupEndpoint = Endpoint<SignupEndpointParams, LoginResult>;
