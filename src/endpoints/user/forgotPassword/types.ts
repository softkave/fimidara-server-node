import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface ForgotPasswordEndpointParams {
  email: string;
}

export type ForgotPasswordEndpoint = Endpoint<IBaseContext, ForgotPasswordEndpointParams>;
