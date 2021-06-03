import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface ISignupParams {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

export interface ISignupContext extends IBaseContext {
    sendEmailVerificationCode: (instData: RequestData) => Promise<void>;
}

export type SignupEndpoint = Endpoint<
    ISignupContext,
    ISignupParams,
    ILoginResult
>;
