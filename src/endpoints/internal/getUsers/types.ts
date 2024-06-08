import {PublicUser} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';

export interface GetUsersEndpointParams {}

export interface GetUsersEndpointResult {
  users: PublicUser[];
}

export type GetUsersEndpoint = Endpoint<GetUsersEndpointParams, GetUsersEndpointResult>;
