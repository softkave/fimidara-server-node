import {Endpoint} from '../../types.js';

export interface UserExistsEndpointParams {
  email: string;
}

export interface UserExistsEndpointResult {
  exists: boolean;
}

export type UserExistsEndpoint = Endpoint<
  UserExistsEndpointParams,
  UserExistsEndpointResult
>;
