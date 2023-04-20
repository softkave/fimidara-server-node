import {PublicUser} from '../../../definitions/user';
import {BaseContext} from '../../contexts/types';
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
  BaseContext,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult
>;
