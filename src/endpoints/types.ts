import {Request, RequestHandler, Response} from 'express';
import {AppResourceType} from '../definitions/system';
import {MddocTypeHttpEndpoint} from '../mddoc/mddoc';
import OperationError from '../utils/OperationError';
import {AnyFn, AnyObject} from '../utils/types';
import RequestData from './RequestData';
import {DataProviderQueryListParams} from './contexts/data/types';
import {SemanticDataAccessProviderMutationRunOptions} from './contexts/semantic/types';
import {BaseContextType} from './contexts/types';

export interface BaseEndpointResult {
  errors?: OperationError[];
}

export type Endpoint<
  TContext extends BaseContextType = BaseContextType,
  TParams = any,
  TResult = any
> = (context: TContext, instData: RequestData<TParams>) => Promise<TResult & BaseEndpointResult>;

export type InferEndpointResult<TEndpoint> = TEndpoint extends Endpoint<
  any,
  any,
  infer InferedResult
>
  ? InferedResult
  : any;

export type InferEndpointParams<TEndpoint> = TEndpoint extends Endpoint<
  any,
  infer InferedParams,
  any
>
  ? InferedParams
  : AnyObject;

export enum ServerRecommendedActions {
  LoginAgain = 'loginAgain',
  Logout = 'logout',
  RequestChangePassword = 'requestChangePassword',
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

export type PaginationQuery = Pick<DataProviderQueryListParams<any>, 'page' | 'pageSize'>;
export type PaginatedEndpointCountParams<T extends PaginationQuery> = Omit<
  T,
  keyof PaginationQuery
>;

export type DeleteResourceCascadeFnDefaultArgs = {workspaceId: string; resourceId: string};
export type DeleteResourceCascadeFnHelperFns = {
  withTxn(fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions]>): Promise<void>;
};
export type DeleteResourceCascadeFn<Args = DeleteResourceCascadeFnDefaultArgs> = (
  context: BaseContextType,
  args: Args,
  helpers: DeleteResourceCascadeFnHelperFns
) => Promise<void>;

export type DeleteResourceCascadeFnsMap<Args = DeleteResourceCascadeFnDefaultArgs> = Record<
  AppResourceType,
  DeleteResourceCascadeFn<Args>
>;

export type HttpEndpointRequestHeaders_AuthOptional = {
  Authorization?: string;
};
export type HttpEndpointRequestHeaders_AuthRequired =
  Required<HttpEndpointRequestHeaders_AuthOptional>;
export type HttpEndpointRequestHeaders_ContentType = {
  'Content-Type': string;
};
export type HttpEndpointRequestHeaders_AuthOptional_ContentType =
  HttpEndpointRequestHeaders_ContentType & HttpEndpointRequestHeaders_AuthOptional;
export type HttpEndpointRequestHeaders_AuthRequired_ContentType =
  Required<HttpEndpointRequestHeaders_AuthOptional_ContentType>;
export type HttpEndpointResponseHeaders_ContentType_ContentLength = {
  'Content-Type': string;
  'Content-Length': string;
};

export type HttpEndpointStructure = {
  pathParameters?: any;
  requestHeaders?: any;
  query?: any;
  requestBody?: any;
  responseHeaders?: any;
  responseBody?: any;
};

export type HttpEndpoint<
  TEndpoint extends Endpoint,
  TRequestBody = InferEndpointParams<TEndpoint>,
  TResponseBody = InferEndpointResult<TEndpoint>,
  TRequestHeaders = AnyObject,
  TResponseHeaders = AnyObject,
  TPathParameters = AnyObject,
  TQuery = AnyObject
> = {
  pathParameters: TPathParameters;
  requestHeaders: TRequestHeaders;
  query: TQuery;
  requestBody: TRequestBody;
  responseHeaders: TResponseHeaders;
  responseBody: TResponseBody;
  endpoint: TEndpoint;
};

export type ExportedHttpEndpointWithMddocDefinition<THttpEndpoint extends HttpEndpoint<any, any>> =
  {
    fn: THttpEndpoint['endpoint'];
    mddocHttpDefinition: MddocTypeHttpEndpoint<{
      pathParameters: THttpEndpoint['pathParameters'];
      query: THttpEndpoint['query'];
      requestHeaders: THttpEndpoint['requestHeaders'];
      requestBody: THttpEndpoint['requestBody'];
      responseHeaders: THttpEndpoint['responseHeaders'];
      responseBody: THttpEndpoint['responseBody'];
    }>;
    getDataFromReq?: (req: Request) => InferEndpointParams<THttpEndpoint['endpoint']>;
    handleResponse?: (res: Response, data: InferEndpointResult<THttpEndpoint['endpoint']>) => void;
    expressRouteMiddleware?: RequestHandler;
  };
