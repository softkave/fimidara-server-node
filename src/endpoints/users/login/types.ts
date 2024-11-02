import {EncodedAgentToken} from '../../../definitions/agentToken.js';
import {PublicUser} from '../../../definitions/user.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface LoginEndpointParams extends EndpointOptionalWorkspaceIdParam {
  email?: string;
  userId?: string;
  password: string;
}

export interface LoginResult extends EncodedAgentToken {
  user: PublicUser;
}

export type LoginEndpoint = Endpoint<LoginEndpointParams, LoginResult>;
