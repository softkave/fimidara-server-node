import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IUpdateUserParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export type UpdateUserEndpoint = Endpoint<IBaseContext, IUpdateUserParams>;
