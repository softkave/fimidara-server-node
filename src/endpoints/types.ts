import {Request, RequestHandler, Response} from 'express';
import {Job} from '../definitions/job';
import {AppResourceType} from '../definitions/system';
import {HttpEndpointDefinitionType} from '../mddoc/mddoc';
import {FimidaraExternalError} from '../utils/OperationError';
import {AnyFn, AnyObject, ObjectValues, OrPromise} from '../utils/types';
import RequestData from './RequestData';
import {SemanticProviderMutationRunOptions} from './contexts/semantic/types';

export interface BaseEndpointResult {
  errors?: FimidaraExternalError[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Endpoint<TParams = any, TResult = void> = (
  instData: RequestData<TParams>
) => Promise<
  TResult extends void ? void | BaseEndpointResult : TResult & BaseEndpointResult
>;

export type InferEndpointResult<TEndpoint> = TEndpoint extends Endpoint<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  infer InferedResult
>
  ? InferedResult extends AnyObject
    ? InferedResult
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any;

export type InferEndpointParams<TEndpoint> = TEndpoint extends Endpoint<
  infer InferedParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>
  ? InferedParams
  : AnyObject;

export const ServerRecommendedActionsMap = {
  LoginAgain: 'loginAgain',
  Logout: 'logout',
  RequestChangePassword: 'requestChangePassword',
} as const;

export type ServerRecommendedActions = ObjectValues<typeof ServerRecommendedActionsMap>;

export type PaginationQuery = {
  pageSize?: number;
  page?: number;
};

export interface PaginatedResult {
  page: number;
}

export interface CountItemsEndpointResult {
  count: number;
}

export interface EndpointOptionalWorkspaceIDParam {
  workspaceId?: string;
}

export interface EndpointRequiredWorkspaceIDParam {
  workspaceId: string;
}

export interface EndpointWorkspaceResourceParam extends EndpointOptionalWorkspaceIDParam {
  providedResourceId?: string;
}

export type PaginatedEndpointCountParams<T extends PaginationQuery> = Omit<
  T,
  keyof PaginationQuery
>;

export type DeleteResourceCascadeFnDefaultArgs = {
  workspaceId: string;
  resourceId: string;
};

export type DeleteResourceCascadeFnHelpers = {
  job: Job;
  withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>): Promise<void>;
};

export type DeleteResourceCascadeFn<Args = DeleteResourceCascadeFnDefaultArgs> = (
  args: Args,
  helpers: DeleteResourceCascadeFnHelpers
) => Promise<void>;

export type DeleteResourceCascadeFnsMap<Args = DeleteResourceCascadeFnDefaultArgs> =
  Record<AppResourceType, DeleteResourceCascadeFn<Args>> &
    Partial<Record<'other', DeleteResourceCascadeFn<Args>>>;

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

export type ExportedHttpEndpoint_GetDataFromReqFn = (req: Request) => OrPromise<unknown>;

export type ExportedHttpEndpoint_HandleResponse = (
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
) => OrPromise<void>;

/** return `true` to defer error handling to server, allowing the function to
 * only augment `processedErrors` instead. This can be useful for adding
 * additional errors or fields to processed errors. */
export type ExportedHttpEndpoint_HandleErrorFn = (
  res: Response,
  processedErrors: FimidaraExternalError[],
  caughtErrors: unknown
) => true | void;

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
  TResponseHeaders extends
    AnyObject = HttpEndpointResponseHeaders_ContentType_ContentLength,
  TResponseBody extends AnyObject = InferEndpointResult<TEndpoint>,
  TSdkParams extends AnyObject = TRequestBody,
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
  handleError?: ExportedHttpEndpoint_HandleErrorFn;
  cleanup?: ExportedHttpEndpoint_Cleanup | Array<ExportedHttpEndpoint_Cleanup>;
  expressRouteMiddleware?: RequestHandler;
};

export type InferMddocHttpEndpointFromMddocEndpointDefinition<T> =
  T extends ExportedHttpEndpointWithMddocDefinition<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const EndpointResultNoteCodeMap = {
  unsupportedOperationInMountBackend: 'unsupportedOperationInMountBackend',
  mountsNotCompletelyIngested: 'mountsNotCompletelyIngested',
} as const;

export type EndpointResultNoteCode = ObjectValues<typeof EndpointResultNoteCodeMap>;

export const kEndpointResultNotesToMessageMap = {
  // TODO: add which mount/backend, and which op
  [EndpointResultNoteCodeMap.unsupportedOperationInMountBackend]: () =>
    'Result may not be entirely accurate, some backends have unsupported ops relied upon during processing.',
  [EndpointResultNoteCodeMap.mountsNotCompletelyIngested]: () =>
    'Some mounts are not completely ingested, so actual result may differ.',
};

export interface EndpointResultNote {
  code: EndpointResultNoteCode;
  message: string;
}
