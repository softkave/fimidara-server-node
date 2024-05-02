import {PublicUser} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';

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
