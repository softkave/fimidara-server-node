import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';
import {LoginResult} from '../login/types';

export interface ChangePasswordWithCurrentPasswordEndpointParams {
  currentPassword: string;
  password: string;
}

export type ChangePasswordWithCurrentPasswordEndpoint = Endpoint<
  BaseContextType,
  ChangePasswordWithCurrentPasswordEndpointParams,
  LoginResult
>;
