import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';
import {ChangePasswordEndpointParams} from '../changePassword/types';
import {LoginResult} from '../login/types';

export type ChangePasswordWithTokenEndpointParams = ChangePasswordEndpointParams;
export type ChangePasswordWithTokenEndpoint = Endpoint<
  BaseContextType,
  ChangePasswordEndpointParams,
  LoginResult
>;
