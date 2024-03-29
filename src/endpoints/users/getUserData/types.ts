import {PublicUser} from '../../../definitions/user';
import {Endpoint} from '../../types';
import {LoginResult} from '../login/types';

export interface GetUserDataResult {
  user: PublicUser;
}

export type GetUserDataEndpoint = Endpoint<{}, LoginResult>;
