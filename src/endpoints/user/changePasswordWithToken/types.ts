import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {IChangePasswordParameters} from '../changePassword/types';
import {ILoginResult} from '../login/types';

export type ChangePasswordWithTokenEndpoint = Endpoint<
  IBaseContext,
  IChangePasswordParameters,
  ILoginResult
>;
