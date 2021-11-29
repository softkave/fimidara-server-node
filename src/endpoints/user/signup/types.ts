import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface ISignupParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type SignupEndpoint = Endpoint<
  IBaseContext,
  ISignupParams,
  ILoginResult
>;
