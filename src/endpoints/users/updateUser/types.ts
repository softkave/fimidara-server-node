import {PublicUser} from '../../../definitions/user.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UpdateUserEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  userId?: string;
  user: UpdateUserInput;
}

export interface UpdateUserEndpointResult {
  user: PublicUser;
}

export type UpdateUserEndpoint = Endpoint<
  UpdateUserEndpointParams,
  UpdateUserEndpointResult
>;
