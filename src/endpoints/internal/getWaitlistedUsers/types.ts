import {PublicUser} from '../../../definitions/user';
import {Endpoint} from '../../types';

export interface GetWaitlistedUsersEndpointParams {}

export interface GetWaitlistedUsersEndpointResult {
  users: PublicUser[];
}

export type GetWaitlistedUsersEndpoint = Endpoint<
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult
>;
