import {PublicUser} from '../../../definitions/user';
import {Endpoint} from '../../types';

export interface GetUsersEndpointParams {}

export interface GetUsersEndpointResult {
  users: PublicUser[];
}

export type GetUsersEndpoint = Endpoint<GetUsersEndpointParams, GetUsersEndpointResult>;
