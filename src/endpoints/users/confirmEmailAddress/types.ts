import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';
import {LoginResult} from '../login/types';

export type ConfirmEmailAddressEndpoint = Endpoint<BaseContextType, {}, LoginResult>;
