import {Request, RequestHandler, Response} from 'express';
import {AppResourceType} from '../definitions/system';
import {MddocTypeHttpEndpoint} from '../mddoc/mddoc';
import OperationError from '../utils/OperationError';
import {AnyObject} from '../utils/types';
import RequestData from './RequestData';
import {IDataProvideQueryListParams} from './contexts/data/types';
import {SemanticDataAccessProviderMutationRunOptions} from './contexts/semantic/types';
import {BaseContext} from './contexts/types';

export interface BaseEndpointResult {
  errors?: OperationError[];
}

export type Endpoint<TContext extends BaseContext = BaseContext, TParams = any, TResult = any> = (
  context: TContext,
  instData: RequestData<TParams>
) => Promise<TResult & BaseEndpointResult>;

export type InferEndpointResult<TEndpoint> = TEndpoint extends Endpoint<
  any,
  any,
  infer InferedResult
>
  ? InferedResult & BaseEndpointResult
  : any;

export type InferEndpointParams<TEndpoint> = TEndpoint extends Endpoint<
  any,
  infer InferedParams,
  any
>
  ? InferedParams
  : AnyObject;

export enum ServerRecommendedActions {
  LoginAgain = 'LoginAgain',
  Logout = 'Logout',
}

export interface RequestDataPendingPromise {
  id: string | number;
  promise: Promise<any>;
}

export interface PaginatedResult {
  page: number;
}

export interface CountItemsEndpointResult {
  count: number;
}

export interface EndpointOptionalWorkspaceIDParam {
  workspaceId?: string;
}

export interface EndpointWorkspaceResourceParam extends EndpointOptionalWorkspaceIDParam {
  providedResourceId?: string;
}

export type PaginationQuery = Pick<IDataProvideQueryListParams<any>, 'page' | 'pageSize'>;
export type PaginatedEndpointCountParams<T extends PaginationQuery> = Omit<
  T,
  keyof PaginationQuery
>;

export type DeleteResourceCascadeFnDefaultArgs = {workspaceId: string; resourceId: string};

export type DeleteResourceCascadeFn<Args = DeleteResourceCascadeFnDefaultArgs> = (
  context: BaseContext,
  args: Args,
  opts: SemanticDataAccessProviderMutationRunOptions
) => Promise<void>;

export type DeleteResourceCascadeFnsMap<Args = DeleteResourceCascadeFnDefaultArgs> = Record<
  AppResourceType,
  DeleteResourceCascadeFn<Args>
>;

export type ExportedHttpEndpoint<TEndpoint extends Endpoint> = {
  fn: TEndpoint;
  mddocHttpDefinition: MddocTypeHttpEndpoint<{
    pathParameters: any;
    query: any;
    requestHeaders: any;
    requestBody: InferEndpointParams<TEndpoint>;
    responseHeaders: any;
    responseBody: InferEndpointResult<TEndpoint>;
  }>;
  getDataFromReq?: (req: Request) => InferEndpointParams<TEndpoint>;
  handleResponse?: (res: Response, data: InferEndpointResult<TEndpoint>) => void;
  expressRouteMiddleware?: RequestHandler;
};
