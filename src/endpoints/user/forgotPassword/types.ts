import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IForgotPasswordParams {
  email: string;
}

export type ForgotPasswordEndpoint = Endpoint<
  IBaseContext,
  IForgotPasswordParams
>;
