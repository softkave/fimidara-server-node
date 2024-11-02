import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface GetUserLoginEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  userId?: string;
}

export type GetUserLoginEndpoint = Endpoint<
  GetUserLoginEndpointParams,
  LoginResult
>;
