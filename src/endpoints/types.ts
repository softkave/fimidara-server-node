import {SessionAgentType} from '../definitions/system';
import OperationError from '../utils/OperationError';
import {IDataProvideQueryListParams} from './contexts/data-providers/types';
import {IBaseContext} from './contexts/types';
import RequestData from './RequestData';

export interface IBaseEndpointResult {
  errors?: OperationError[];
}

export type Endpoint<Context extends IBaseContext = IBaseContext, Data = any, Result = any> = (
  context: Context,
  instData: RequestData<Data>
) => Promise<Result & IBaseEndpointResult>;

export type InferEndpointResult<E> = E extends Endpoint<any, any, infer R> ? R & IBaseEndpointResult : any;

export enum ServerRecommendedActions {
  LoginAgain = 'LoginAgain',
  Logout = 'Logout',
}

export interface IPublicAgent {
  agentId: string;
  agentType: SessionAgentType;
}

export interface IRequestDataPendingPromise {
  id: string | number;
  promise: Promise<any>;
}

export interface IPaginatedResult {
  page: number;
  pageSize: number;
  count: number;
}

export type IPaginationQuery = Pick<IDataProvideQueryListParams<any>, 'page' | 'pageSize'>;
