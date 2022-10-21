import {IUser} from '../../../../definitions/user';
import {DataQuery, IBaseDataProvider} from '../types';

export type IUserQuery = DataQuery<IUser>;
export type IUserDataProvider = IBaseDataProvider<IUser>;
