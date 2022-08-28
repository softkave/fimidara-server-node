import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IForgotPasswordParams {
  email: string;
}

export type ForgotPasswordEndpoint = Endpoint<
  IBaseContext,
  IForgotPasswordParams
>;
