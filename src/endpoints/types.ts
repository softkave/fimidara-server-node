import {AppResourceType} from '../definitions/system';
import OperationError from '../utils/OperationError';
import {IDataProvideQueryListParams} from './contexts/data/types';
import {IBaseContext} from './contexts/types';
import RequestData from './RequestData';

export interface IBaseEndpointResult {
  errors?: OperationError[];
}

export type Endpoint<Context extends IBaseContext = IBaseContext, Data = any, Result = any> = (
  context: Context,
  instData: RequestData<Data>
) => Promise<Result & IBaseEndpointResult>;

export type InferEndpointResult<E> = E extends Endpoint<any, any, infer R>
  ? R & IBaseEndpointResult
  : any;

export enum ServerRecommendedActions {
  LoginAgain = 'LoginAgain',
  Logout = 'Logout',
}

export interface IRequestDataPendingPromise {
  id: string | number;
  promise: Promise<any>;
}

export interface IPaginatedResult {
  page: number;
}

export interface ICountItemsEndpointResult {
  count: number;
}

export interface IEndpointOptionalWorkspaceIDParam {
  workspaceId?: string;
}

export interface IEndpointWorkspaceResourceParam extends IEndpointOptionalWorkspaceIDParam {
  providedResourceId?: string;
}

export type IPaginationQuery = Pick<IDataProvideQueryListParams<any>, 'page' | 'pageSize'>;
export type PaginatedEndpointCountParams<T extends IPaginationQuery> = Omit<
  T,
  keyof IPaginationQuery
>;

export type DeleteResourceCascadeFn = (context: IBaseContext, resourceId: string) => Promise<void>;
export type DeleteResourceCascadeFnsMap = Record<AppResourceType, DeleteResourceCascadeFn>;
