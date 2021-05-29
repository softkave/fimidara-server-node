import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';
import {IPublicUserData} from '../types';

export interface ILoginParams {
    email: string;
    password: string;
}

export interface ILoginResult {
    user: IPublicUserData;
    token: string;
}

export type LoginEndpoint = Endpoint<IBaseContext, ILoginParams, ILoginResult>;
