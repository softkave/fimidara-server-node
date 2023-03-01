import {IPublicUserData} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUpdateUserEndpointParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface IUpdateUserEndpointResult {
  user: IPublicUserData;
}

export type UpdateUserEndpoint = Endpoint<
  IBaseContext,
  IUpdateUserEndpointParams,
  IUpdateUserEndpointResult
>;
