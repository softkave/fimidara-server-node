import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {LoginResult} from '../login/types';

export interface ChangePasswordEndpointParams {
  password: string;
}

export type ChangePasswordEndpoint = Endpoint<
  BaseContext,
  ChangePasswordEndpointParams,
  LoginResult
>;
