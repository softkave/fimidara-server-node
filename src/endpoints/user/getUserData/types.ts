import {IPublicUserData} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface IGetUserDataResult {
  user: IPublicUserData;
}

export type GetUserDataEndpoint = Endpoint<
  IBaseContext,
  undefined,
  ILoginResult
>;
