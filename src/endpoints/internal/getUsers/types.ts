import {PublicUser} from '../../../definitions/user';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface GetUsersEndpointParams {}

export interface GetUsersEndpointResult {
  users: PublicUser[];
}

export type GetUsersEndpoint = Endpoint<
  BaseContextType,
  GetUsersEndpointParams,
  GetUsersEndpointResult
>;
