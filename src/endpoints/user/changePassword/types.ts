import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface IChangePasswordParams {
    password: string;
}

export type ChangePasswordEndpoint = Endpoint<
    IBaseContext,
    IChangePasswordParams,
    ILoginResult
>;
