import {Endpoint} from '../../types';

export interface ForgotPasswordEndpointParams {
  email: string;
}

export type ForgotPasswordEndpoint = Endpoint<ForgotPasswordEndpointParams>;
