import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {ISendChangePasswordEmailParams} from './sendChangePasswordEmail';

export interface IForgotPasswordParams {
  email: string;
}

export interface IForgotPasswordContext extends IBaseContext {
  sendChangePasswordEmail: (
    ctx: IBaseContext,
    props: ISendChangePasswordEmailParams
  ) => Promise<any>;
}

export type ForgotPasswordEndpoint = Endpoint<
  IForgotPasswordContext,
  IForgotPasswordParams
>;
