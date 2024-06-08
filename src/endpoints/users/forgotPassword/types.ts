import {Endpoint} from '../../types.js';

export interface ForgotPasswordEndpointParams {
  email: string;
}

export type ForgotPasswordEndpoint = Endpoint<ForgotPasswordEndpointParams>;
