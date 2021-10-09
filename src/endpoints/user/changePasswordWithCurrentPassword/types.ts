import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface IChangePasswordWithCurrentPasswordEndpointParams {
  currentPassword: string;
  password: string;
}

export interface IChangePasswordWithCurrentPasswordContext
  extends IBaseContext {
  changePassword: (
    context: IBaseContext,
    instData: RequestData,
    password: string
  ) => Promise<ILoginResult>;
}

export type ChangePasswordWithCurrentPasswordEndpoint = Endpoint<
  IChangePasswordWithCurrentPasswordContext,
  IChangePasswordWithCurrentPasswordEndpointParams,
  ILoginResult
>;
