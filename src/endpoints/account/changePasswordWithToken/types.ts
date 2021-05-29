import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';
import changePassword from '../changePassword/changePassword';
import {IChangePasswordParams} from '../changePassword/types';
import {ILoginResult} from '../login/types';

export interface IChangePasswordWithTokenContext extends IBaseContext {
    changePassword: typeof changePassword;
}

export type ChangePasswordWithTokenEndpoint = Endpoint<
    IChangePasswordWithTokenContext,
    IChangePasswordParams,
    ILoginResult
>;
