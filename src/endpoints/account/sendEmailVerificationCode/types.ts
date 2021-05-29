import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';

export interface ISendEmailVerificationCodeEndpointContext
    extends IBaseContext {
    sendEmail: (
        ctx: IBaseContext,
        email: string,
        firstName: string,
        code: string
    ) => Promise<void>;
}

export type SendEmailVerificationCodeEndpoint = Endpoint<ISendEmailVerificationCodeEndpointContext>;
