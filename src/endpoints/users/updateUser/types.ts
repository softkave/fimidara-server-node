import {PublicUser} from '../../../definitions/user';
import {Endpoint} from '../../types';

export interface UpdateUserEndpointParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UpdateUserEndpointResult {
  user: PublicUser;
}

export type UpdateUserEndpoint = Endpoint<
  UpdateUserEndpointParams,
  UpdateUserEndpointResult
>;
