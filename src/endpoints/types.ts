import {Request, RequestHandler, Response} from 'express';
import {AppResourceType} from '../definitions/system';
import {HttpEndpointDefinitionType} from '../mddoc/mddoc';
import {EndpointExportedError} from '../utils/OperationError';
import {AnyFn, AnyObject, OrPromise} from '../utils/types';
import RequestData from './RequestData';
import {DataProviderQueryListParams} from './contexts/data/types';
import {SemanticDataAccessProviderMutationRunOptions} from './contexts/semantic/types';
import {BaseContextType} from './contexts/types';

export interface BaseEndpointResult {
  errors?: EndpointExportedError[];
}

export type Endpoint<
  TContext extends BaseContextType = BaseContextType,
  TParams = any,
  TResult = any
> = (
  context: TContext,
  instData: RequestData<TParams>
) => Promise<TResult & BaseEndpointResult>;

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

export type DeleteResourceCascadeFnDefaultArgs = {
  workspaceId: string;
  resourceId: string;
};
export type DeleteResourceCascadeFnHelperFns = {
  withTxn(fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions]>): Promise<void>;
};
export type DeleteResourceCascadeFn<Args = DeleteResourceCascadeFnDefaultArgs> = (
  context: BaseContextType,
  args: Args,
  helpers: DeleteResourceCascadeFnHelperFns
) => Promise<void>;

export type DeleteResourceCascadeFnsMap<Args = DeleteResourceCascadeFnDefaultArgs> =
  Record<AppResourceType, DeleteResourceCascadeFn<Args>>;

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

export type ExportedHttpEndpoint_GetDataFromReqFn = (req: Request) => OrPromise<any>;
export type ExportedHttpEndpoint_HandleResponse = (
  res: Response,
  data: any
) => OrPromise<void>;
export type ExportedHttpEndpoint_Cleanup = (
  req: Request,
  res: Response
) => OrPromise<void>;
export type ExportedHttpEndpointWithMddocDefinition<
  TEndpoint extends Endpoint = Endpoint,
  TRequestHeaders extends AnyObject = HttpEndpointRequestHeaders_AuthRequired_ContentType,
  TPathParameters extends AnyObject = AnyObject,
  TQuery extends AnyObject = AnyObject,
  TRequestBody extends AnyObject = InferEndpointParams<TEndpoint>,
  TResponseHeaders extends AnyObject = HttpEndpointResponseHeaders_ContentType_ContentLength,
  TResponseBody extends AnyObject = InferEndpointResult<TEndpoint>,
  TSdkParams extends AnyObject = TRequestBody
> = {
  fn: TEndpoint;
  mddocHttpDefinition: HttpEndpointDefinitionType<
    TRequestHeaders,
    TPathParameters,
    TQuery,
    TRequestBody,
    TResponseHeaders,
    TResponseBody,
    TSdkParams
  >;
  getDataFromReq?: (req: Request) => OrPromise<InferEndpointParams<TEndpoint>>;
  handleResponse?: (
    res: Response,
    data: InferEndpointResult<TEndpoint>
  ) => OrPromise<void>;
  cleanup?: (req: Request, res: Response) => OrPromise<void>;
  expressRouteMiddleware?: RequestHandler;
};

export type InferMddocHttpEndpointFromMddocEndpointDefinition<T> =
  T extends ExportedHttpEndpointWithMddocDefinition<
    any,
    infer T0,
    infer T1,
    infer T2,
    infer T3,
    infer T4,
    infer T5,
    infer T6
  >
    ? HttpEndpointDefinitionType<T0, T1, T2, T3, T4, T5, T6>
    : never;
