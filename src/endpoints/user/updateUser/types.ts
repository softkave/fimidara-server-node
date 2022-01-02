import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicUserData} from '../types';

export interface IUpdateUserParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface IUpdateUserResult {
  user: IPublicUserData;
}

export type UpdateUserEndpoint = Endpoint<
  IBaseContext,
  IUpdateUserParams,
  IUpdateUserResult
>;
