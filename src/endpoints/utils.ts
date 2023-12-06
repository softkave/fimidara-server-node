import {Express, Request, Response} from 'express';
import {compact, defaultTo, isString} from 'lodash';
import {
  Agent,
  PublicAgent,
  PublicResource,
  PublicWorkspaceResource,
  WorkspaceResource,
} from '../definitions/system';
import {Workspace} from '../definitions/workspace';
import OperationError, {FimidaraExternalError} from '../utils/OperationError';
import {appAssert} from '../utils/assertion';
import {getTimestamp} from '../utils/dateFns';
import {ServerError} from '../utils/errors';
import {
  ExtractFieldsFrom,
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../utils/extract';
import {isObjectEmpty, toCompactArray} from '../utils/fns';
import {serverLogger} from '../utils/logger/loggerUtils';
import {kReuseableErrors} from '../utils/reusableErrors';
import {AnyFn, AnyObject, OrPromise} from '../utils/types';
import RequestData from './RequestData';
import {endpointConstants} from './constants';
import {kAsyncLocalStorageUtils} from './contexts/asyncLocalStorage';
import {ResolvedTargetChildrenAccessCheck} from './contexts/authorizationChecks/checkAuthorizaton';
import {DataQuery} from './contexts/data/types';
import {getPage} from './contexts/data/utils';
import {SemanticProviderMutationRunOptions} from './contexts/semantic/types';
import {getInAndNinQuery} from './contexts/semantic/utils';
import {BaseContextType, IServerRequest} from './contexts/types';
import {InvalidRequestError, NotFoundError} from './errors';
import {
  DeleteResourceCascadeFnHelperFns,
  DeleteResourceCascadeFnsMap,
  Endpoint,
  ExportedHttpEndpointWithMddocDefinition,
  ExportedHttpEndpoint_Cleanup,
  ExportedHttpEndpoint_GetDataFromReqFn,
  ExportedHttpEndpoint_HandleResponse,
  PaginationQuery,
} from './types';
import {PermissionDeniedError} from './users/errors';

export function extractExternalEndpointError(
  errorItem: OperationError
): FimidaraExternalError {
  return {
    name: errorItem.name,
    message: errorItem.message,
    action: errorItem.action,
    field: errorItem.field,
  };
}

export function getPublicErrors(inputError: any) {
  const errors: OperationError[] = Array.isArray(inputError) ? inputError : [inputError];

  // We are mapping errors cause some values don't show if we don't
  // or was it errors, not sure anymore, this is old code.
  // TODO: Feel free to look into it, cause it could help performance.
  const preppedErrors: FimidaraExternalError[] = [];
  errors.forEach(
    errorItem =>
      errorItem?.isPublicError &&
      preppedErrors.push(extractExternalEndpointError(errorItem))
  );

  if (preppedErrors.length === 0) {
    const serverError = new ServerError();
    preppedErrors.push(extractExternalEndpointError(serverError));
  }

  return preppedErrors;
}

export function prepareResponseError(error: unknown) {
  serverLogger.error(error);
  let statusCode = endpointConstants.httpStatusCode.serverError;
  const errors = Array.isArray(error) ? error : [error];
  const preppedErrors = getPublicErrors(errors);

  if (errors.length > 0 && errors[0].statusCode) {
    statusCode = errors[0].statusCode;
  }

  return {statusCode, preppedErrors};
}

export function settlePromisesAndLogFailed(promises: Array<OrPromise<unknown>>) {
  Promise.allSettled(promises)
    .then(results => {
      results.forEach(nextResult => {
        if (nextResult.status === 'rejected') {
          serverLogger.error(nextResult.reason);
        }
      });
    })
    .catch(error => serverLogger.error(error));
}

export function defaultEndpointCleanup() {
  const disposables = kAsyncLocalStorageUtils.getDisposables();
  settlePromisesAndLogFailed(disposables.map(disposable => disposable.close()));
}

export const wrapEndpointREST = <
  Context extends BaseContextType,
  EndpointType extends Endpoint<Context>
>(
  endpoint: EndpointType,
  context: Context,
  handleResponse?: ExportedHttpEndpoint_HandleResponse,
  getData?: ExportedHttpEndpoint_GetDataFromReqFn,
  cleanup?: ExportedHttpEndpoint_Cleanup | Array<ExportedHttpEndpoint_Cleanup>
): ((req: Request, res: Response) => any) => {
  return async (req: Request, res: Response) => {
    try {
      const data = await (getData ? getData(req) : req.body);
      const instData = RequestData.fromExpressRequest(
        req as unknown as IServerRequest,
        data
      );
      const result = await endpoint(context, instData);

      if (handleResponse) {
        await handleResponse(res, result);
      } else {
        res.status(endpointConstants.httpStatusCode.ok).json(result ?? {});
      }
    } catch (error) {
      const {statusCode, preppedErrors} = prepareResponseError(error);
      const result = {errors: preppedErrors};
      res.status(statusCode).json(result);
    } finally {
      const cleanupFns = toCompactArray(cleanup).concat(defaultEndpointCleanup);
      settlePromisesAndLogFailed(cleanupFns.map(fn => fn(req, res)));
    }
  };
};

const agentPublicFields = getFields<PublicAgent>({
  agentId: true,
  agentType: true,
});

export const agentExtractor = makeExtract(agentPublicFields);
export const agentExtractorIfPresent = makeExtractIfPresent(agentPublicFields);
export const agentListExtractor = makeListExtract(agentPublicFields);

export const resourceFields: ExtractFieldsFrom<PublicResource> = {
  resourceId: true,
  createdAt: true,
  lastUpdatedAt: true,
};
export const workspaceResourceFields: ExtractFieldsFrom<PublicWorkspaceResource> = {
  ...resourceFields,
  // providedResourceId: true,
  workspaceId: true,
  createdBy: agentExtractor,
  lastUpdatedBy: agentExtractor,
};

export function throwNotFound() {
  throw new NotFoundError();
}

export function throwAgentTokenNotFound() {
  throw kReuseableErrors.agentToken.notFound();
}

export type ResourceWithoutAssignedAgent<T> = Omit<T, 'assignedAt' | 'assignedBy'>;
type AssignedAgent = {
  assignedBy: Agent;
  assignedAt: number;
};

export function withAssignedAgent<T extends AnyObject>(
  agent: Agent,
  item: T
): T & AssignedAgent {
  return {
    ...item,
    assignedAt: getTimestamp(),
    assignedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
      agentTokenId: agent.agentTokenId,
    },
  };
}

export function withAssignedAgentList<T extends AnyObject>(
  agent: Agent,
  items: T[] = []
): Array<T & AssignedAgent> {
  return items.map(item => ({
    ...item,
    assignedAt: getTimestamp(),
    assignedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
      agentTokenId: agent.agentTokenId,
    },
  }));
}

export function endpointDecodeURIComponent(component?: any) {
  return component && isString(component) ? decodeURIComponent(component) : undefined;
}

export function getEndpointPageFromInput(p: PaginationQuery, defaultPage = 0): number {
  return defaultTo(getPage(p.page), defaultPage);
}

export function getWorkspaceResourceListQuery00(
  workspace: Workspace,
  report: ResolvedTargetChildrenAccessCheck
) {
  if (report.access === 'full') {
    return {
      workspaceId: workspace.resourceId,
      excludeResourceIdList: report.partialDenyIds?.length
        ? report.partialDenyIds
        : undefined,
    };
  } else if (report.access === 'partial') {
    return {
      workspaceId: workspace.resourceId,
      resourceIdList: report.partialAllowIds,
    };
  }

  throw new PermissionDeniedError({item: report.item});
}

export function getWorkspaceResourceListQuery01(
  workspace: Workspace,
  report: ResolvedTargetChildrenAccessCheck
): DataQuery<WorkspaceResource> {
  const query = getWorkspaceResourceListQuery00(workspace, report);
  return {
    workspaceId: workspace.resourceId,
    ...getInAndNinQuery<WorkspaceResource>(
      'resourceId',
      query.resourceIdList,
      query.excludeResourceIdList
    ),
  };
}

export function applyDefaultEndpointPaginationOptions(data: PaginationQuery) {
  if (data.page === undefined) data.page = endpointConstants.minPage;
  else data.page = Math.max(endpointConstants.minPage, data.page);

  if (data.pageSize === undefined) data.pageSize = endpointConstants.maxPageSize;
  else data.pageSize = Math.max(endpointConstants.minPageSize, data.pageSize);

  return data;
}

export async function executeCascadeDelete<Args>(
  context: BaseContextType,
  cascadeDef: DeleteResourceCascadeFnsMap<Args>,
  args: Args
) {
  const helperFns: DeleteResourceCascadeFnHelperFns = {
    async withTxn(fn: AnyFn<[SemanticProviderMutationRunOptions]>) {
      await context.semantic.utils.withTxn(opts => fn(opts));
    },
  };

  await Promise.all(Object.values(cascadeDef).map(fn => fn(context, args, helperFns)));
}

export function assertUpdateNotEmpty(update: AnyObject) {
  appAssert(
    !isObjectEmpty(update),
    new InvalidRequestError('Update data provided is empty.')
  );
}

export function registerExpressRouteFromEndpoint(
  ctx: BaseContextType,
  endpoint: ExportedHttpEndpointWithMddocDefinition<any>,
  app: Express
) {
  const p = endpoint.mddocHttpDefinition.assertGetBasePathname();
  const expressPath = endpoint.mddocHttpDefinition.getPathParamaters() ? `${p}*` : p;
  app[endpoint.mddocHttpDefinition.assertGetMethod()](
    expressPath,
    ...compact([
      endpoint.expressRouteMiddleware,
      wrapEndpointREST(
        endpoint.fn,
        ctx,
        endpoint.handleResponse,
        endpoint.getDataFromReq,
        endpoint.cleanup
      ),
    ])
  );
}

export function isResourceNameEqual(name01: string, name02: string) {
  return name01.toLowerCase() === name02.toLowerCase();
}
