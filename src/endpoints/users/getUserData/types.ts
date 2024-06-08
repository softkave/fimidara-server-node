import {PublicUser} from '../../../definitions/user.js';
import {Endpoint} from '../../types.js';
import {LoginResult} from '../login/types.js';

export interface GetUserDataResult {
  user: PublicUser;
}

export type GetUserDataEndpoint = Endpoint<{}, LoginResult>;
