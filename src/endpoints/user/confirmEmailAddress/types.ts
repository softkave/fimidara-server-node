import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export interface IConfirmEmailAddressEndpointParams {
    code: string;
}

export type ConfirmEmailAddressEndpoint = Endpoint<
    IBaseContext,
    IConfirmEmailAddressEndpointParams,
    ILoginResult
>;
