import {IPublicUserData} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

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
