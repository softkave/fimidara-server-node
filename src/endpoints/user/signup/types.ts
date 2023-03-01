import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface ISignupEndpointParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type SignupEndpoint = Endpoint<IBaseContext, ISignupEndpointParams, ILoginResult>;
