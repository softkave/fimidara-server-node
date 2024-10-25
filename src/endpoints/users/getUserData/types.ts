import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export type GetUserDataEndpoint = Endpoint<{}, LoginResult>;
