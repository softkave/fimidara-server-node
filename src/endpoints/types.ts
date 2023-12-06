import {Request, RequestHandler, Response} from 'express';
import {FileBackendMount} from '../definitions/fileBackend';
import {AppResourceType} from '../definitions/system';
import {HttpEndpointDefinitionType} from '../mddoc/mddoc';
import {EndpointExportedError} from '../utils/OperationError';
import {AnyFn, AnyObject, ObjectValues, OrPromise} from '../utils/types';
import RequestData from './RequestData';
import {SemanticProviderMutationRunOptions} from './contexts/semantic/types';
import {BaseContextType} from './contexts/types';
import {kFolderConstants} from './folders/constants';

export interface BaseEndpointResult {
  errors?: EndpointExportedError[];
}

export type Endpoint<
  TContext extends BaseContextType = BaseContextType,
  TParams = any,
  TResult = void
> = (
  context: TContext,
  instData: RequestData<TParams>
) => Promise<
  TResult extends void ? void | BaseEndpointResult : TResult & BaseEndpointResult
>;

export type InferEndpointResult<TEndpoint> = TEndpoint extends Endpoint<
  any,
  any,
  infer InferedResult
>
  ? InferedResult extends AnyObject
    ? InferedResult
    : any
  : any;

export type InferEndpointParams<TEndpoint> = TEndpoint extends Endpoint<
  any,
  infer InferedParams,
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
  pageSize: number;
  page: number;
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

export type DeleteResourceCascadeFnHelperFns = {
  withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>): Promise<void>;
};

export type DeleteResourceCascadeFn<Args = DeleteResourceCascadeFnDefaultArgs> = (
  context: BaseContextType,
  args: Args,
  helpers: DeleteResourceCascadeFnHelperFns
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
  cleanup?: ExportedHttpEndpoint_Cleanup | Array<ExportedHttpEndpoint_Cleanup>;
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

export interface EndpointResultNote {
  code: string;
  message: string;
}

export const EndpointResultNoteCodeMap = {
  unsupportedOperationInMountBackend: 'unsupportedOperationInMountBackend',
  mountsNotCompletelyIngested: 'mountsNotCompletelyIngested',
} as const;

export type EndpointResultNoteCode = ObjectValues<typeof EndpointResultNoteCodeMap>;

export const kEndpointResultNotesToMessageMap: Record<
  EndpointResultNoteCode,
  (...args: any[]) => string
> = {
  unsupportedOperationInMountBackend: (mount: FileBackendMount) =>
    `Mount ${mount.name} from ${mount.backend} mounted to ${mount.folderpath.join(
      kFolderConstants.separator
    )} does not support operation.`,
  mountsNotCompletelyIngested: () =>
    'Some mounts are not completely ingested, so actual result may differ.',
};
