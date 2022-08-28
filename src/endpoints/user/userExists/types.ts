import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUserExistsParams {
  email: string;
}

export interface IUserExistsResult {
  exists: boolean;
}

export type UserExistsEndpoint = Endpoint<
  IBaseContext,
  IUserExistsParams,
  IUserExistsResult
>;
