import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface ChangePasswordEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  userId?: string;
  currentPassword?: string;
  password: string;
}

export type ChangePasswordEndpoint = Endpoint<
  ChangePasswordEndpointParams,
  LoginResult
>;
