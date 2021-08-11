import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export type ConfirmEmailAddressEndpoint = Endpoint<
    IBaseContext,
    undefined,
    ILoginResult
>;
