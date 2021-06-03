import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicAuthKey} from '../types';

export interface IAddAuthKeyParams {
    organizationId: string;
}

export interface IAddAuthKeyResult {
    authKey: IPublicAuthKey;
}

export type AddAuthKeyEndpoint = Endpoint<
    IBaseContext,
    IAddAuthKeyParams,
    IAddAuthKeyResult
>;
