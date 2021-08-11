import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {Endpoint} from '../../types';

export interface IUpdateUserParams {
    firstName?: string;
    lastName?: string;
    email?: string;
}

export interface IUpdateUserEndpointContext extends IBaseContext {
    sendEmailVerificationCode: (instData: RequestData) => Promise<void>;
}

export type UpdateUserEndpoint = Endpoint<
    IUpdateUserEndpointContext,
    IUpdateUserParams
>;
