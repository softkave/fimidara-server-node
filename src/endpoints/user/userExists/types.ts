import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IUserExistsEndpointParams {
  email: string;
}

export interface IUserExistsEndpointResult {
  exists: boolean;
}

export type UserExistsEndpoint = Endpoint<
  IBaseContext,
  IUserExistsEndpointParams,
  IUserExistsEndpointResult
>;
