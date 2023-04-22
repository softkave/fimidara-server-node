import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';
import {LoginResult} from '../login/types';

export interface SignupEndpointParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type SignupEndpoint = Endpoint<BaseContextType, SignupEndpointParams, LoginResult>;
