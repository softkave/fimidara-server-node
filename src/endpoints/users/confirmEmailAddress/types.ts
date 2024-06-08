import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export type ConfirmEmailAddressEndpoint = Endpoint<{}, LoginResult>;
