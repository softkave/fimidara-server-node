import {PublicUser} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';

export interface GetWaitlistedUsersEndpointParams {}

export interface GetWaitlistedUsersEndpointResult {
  users: PublicUser[];
}

export type GetWaitlistedUsersEndpoint = Endpoint<
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult
>;
