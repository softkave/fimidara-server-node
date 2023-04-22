import {PublicUser} from '../../../definitions/user';
import {BaseContextType} from '../../contexts/types';
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
  BaseContextType,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult
>;
