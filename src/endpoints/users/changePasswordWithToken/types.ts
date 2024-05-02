import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export type ChangePasswordWithTokenEndpointParams = {password: string};
export type ChangePasswordWithTokenEndpoint = Endpoint<
  ChangePasswordWithTokenEndpointParams,
  LoginResult
>;
