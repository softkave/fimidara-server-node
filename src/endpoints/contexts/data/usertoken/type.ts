import {IUserToken} from '../../../../definitions/userToken';
import {DataQuery, IBaseDataProvider} from '../types';

export type IUserTokenQuery = DataQuery<IUserToken>;
export type IUserTokenDataProvider = IBaseDataProvider<IUserToken>;
