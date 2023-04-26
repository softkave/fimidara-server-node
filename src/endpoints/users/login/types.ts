import {PublicUser} from '../../../definitions/user';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface LoginEndpointParams {
  email: string;
  password: string;
}

export interface LoginResult {
  user: PublicUser;
  token: string;
  clientAssignedToken: string;
}

export type LoginEndpoint = Endpoint<BaseContextType, LoginEndpointParams, LoginResult>;
