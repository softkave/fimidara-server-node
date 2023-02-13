import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {ILoginResult} from '../login/types';

export type ConfirmEmailAddressEndpoint = Endpoint<IBaseContext, {}, ILoginResult>;
