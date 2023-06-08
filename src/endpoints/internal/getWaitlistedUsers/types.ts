import {PublicUser} from '../../../definitions/user';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetWaitlistedUsersEndpointParams {}

export interface GetWaitlistedUsersEndpointResult {
  users: PublicUser[];
}

export type GetWaitlistedUsersEndpoint = Endpoint<
  BaseContextType,
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult
>;
