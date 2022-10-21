import {IClientAssignedToken} from '../../../../definitions/clientAssignedToken';
import {DataQuery, IBaseDataProvider} from '../types';

export type IClientAssignedTokenQuery = DataQuery<IClientAssignedToken>;
export type IClientAssignedTokenDataProvider =
  IBaseDataProvider<IClientAssignedToken>;
