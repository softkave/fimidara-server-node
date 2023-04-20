import {BaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface UserExistsEndpointParams {
  email: string;
}

export interface UserExistsEndpointResult {
  exists: boolean;
}

export type UserExistsEndpoint = Endpoint<
  BaseContext,
  UserExistsEndpointParams,
  UserExistsEndpointResult
>;
