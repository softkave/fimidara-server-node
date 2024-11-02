import {EmptyObject} from 'softkave-js-utils';
import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export type ConfirmEmailAddressEndpoint = Endpoint<EmptyObject, LoginResult>;
