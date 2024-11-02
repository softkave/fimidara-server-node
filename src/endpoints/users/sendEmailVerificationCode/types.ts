import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface SendEmailVerificationCodeEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  userId?: string;
}

export type SendEmailVerificationCodeEndpoint =
  Endpoint<SendEmailVerificationCodeEndpointParams>;
