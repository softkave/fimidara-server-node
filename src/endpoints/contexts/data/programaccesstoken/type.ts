import {IProgramAccessToken} from '../../../../definitions/programAccessToken';
import {DataQuery, IBaseDataProvider} from '../types';

export type IProgramAccessTokenQuery = DataQuery<IProgramAccessToken>;
export type IProgramAccessTokenDataProvider =
  IBaseDataProvider<IProgramAccessToken>;
