import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IForgotPasswordEndpointParams {
  email: string;
}

export type ForgotPasswordEndpoint = Endpoint<IBaseContext, IForgotPasswordEndpointParams>;
