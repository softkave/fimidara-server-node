import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';

export interface ISendPhoneVerificationCodeEndpointContext
    extends IBaseContext {
    sendCode: (ctx: IBaseContext, phone: string) => Promise<string>;
}

export type SendPhoneVerificationCodeEndpoint = Endpoint<
    ISendPhoneVerificationCodeEndpointContext,
    // eslint-disable-next-line @typescript-eslint/ban-types
    {}
>;
