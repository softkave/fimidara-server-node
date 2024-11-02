import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface ForgotPasswordEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  email?: string;
  userId?: string;
}

export type ForgotPasswordEndpoint = Endpoint<ForgotPasswordEndpointParams>;
