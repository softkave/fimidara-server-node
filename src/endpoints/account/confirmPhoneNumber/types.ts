import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface IConfirmPhoneNumberEndpointParams {
    code: string;
}

export interface IConfirmPhoneNumberEndpointContext extends IBaseContext {
    verifyCode: (
        ctx: IBaseContext,
        phone: string,
        code: string
    ) => Promise<void>;
}

export type ConfirmPhoneNumberEndpoint = Endpoint<
    IConfirmPhoneNumberEndpointContext,
    IConfirmPhoneNumberEndpointParams,
    ILoginResult
>;
