import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface ISendEmailVerificationCodeEndpointContext
  extends IBaseContext {
  sendEmail: (
    ctx: IBaseContext,
    email: string,
    firstName: string,
    link: string
  ) => Promise<void>;
}

export type SendEmailVerificationCodeEndpoint = Endpoint<ISendEmailVerificationCodeEndpointContext>;
