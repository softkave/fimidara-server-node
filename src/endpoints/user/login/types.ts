import {IPublicUserData} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface ILoginParams {
  email: string;
  password: string;
}

export interface ILoginResult {
  user: IPublicUserData;
  token: string;
  clientAssignedToken: string;
}

export type LoginEndpoint = Endpoint<IBaseContext, ILoginParams, ILoginResult>;
