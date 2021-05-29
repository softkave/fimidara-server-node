import {IBaseContext} from '../../BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateUserParams {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
}

export type UpdateUserEndpoint = Endpoint<IBaseContext, IUpdateUserParams>;
