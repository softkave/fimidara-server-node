import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface ChangePasswordWithCurrentPasswordEndpointParams {
  currentPassword: string;
  password: string;
}

export type ChangePasswordWithCurrentPasswordEndpoint = Endpoint<
  ChangePasswordWithCurrentPasswordEndpointParams,
  LoginResult
>;
