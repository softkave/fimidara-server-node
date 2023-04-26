import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';
import {LoginResult} from '../login/types';

export type ChangePasswordWithTokenEndpointParams = {password: string};
export type ChangePasswordWithTokenEndpoint = Endpoint<
  BaseContextType,
  ChangePasswordWithTokenEndpointParams,
  LoginResult
>;
