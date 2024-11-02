import {PublicUser} from '../../../definitions/user.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetUserEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  userId?: string;
}

export interface GetUserEndpointResult {
  user: PublicUser;
}

export type GetUserEndpoint = Endpoint<
  GetUserEndpointParams,
  GetUserEndpointResult
>;
