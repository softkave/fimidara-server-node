import {Express, Request, Response} from 'express';
import {compact, isString} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {
  ResolvedTargetChildrenAccessCheck,
  kResolvedTargetChildrenAccess,
} from '../contexts/authorizationChecks/checkAuthorizaton.js';
import {DataQuery} from '../contexts/data/types.js';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {getInAndNinQuery} from '../contexts/semantic/utils.js';
import {IServerRequest} from '../contexts/types.js';
import {Agent, WorkspaceResource} from '../definitions/system.js';
import {Workspace} from '../definitions/workspace.js';
import OperationError, {
  FimidaraExternalError,
} from '../utils/OperationError.js';
import {appAssert} from '../utils/assertion.js';
import {getTimestamp} from '../utils/dateFns.js';
import {ServerError} from '../utils/errors.js';
import {isObjectEmpty, toCompactArray} from '../utils/fns.js';
import RequestData from './RequestData.js';
import {kEndpointConstants} from './constants.js';
import {InvalidRequestError, NotFoundError} from './errors.js';
import {
  Endpoint,
  ExportedHttpEndpointWithMddocDefinition,
  ExportedHttpEndpoint_Cleanup,
  ExportedHttpEndpoint_GetDataFromReqFn,
  ExportedHttpEndpoint_HandleErrorFn,
  ExportedHttpEndpoint_HandleResponse,
} from './types.js';
import {PermissionDeniedError} from './users/errors.js';

export function extractExternalEndpointError(
  errorItem: OperationError
): FimidaraExternalError {
  return {
    name: errorItem.name,
    message: errorItem.message,
    action: errorItem.action,
    field: errorItem.field,
    notes: errorItem.notes,
  };
}

export function getPublicErrors(inputError: unknown) {
  const errors: unknown[] = Array.isArray(inputError)
    ? inputError
    : [inputError];

  // We are mapping errors cause some values don't show if we don't
  // or was it errors, not sure anymore, this is old code.
  // TODO: Feel free to look into it, cause it could help performance.
  const preppedErrors: FimidaraExternalError[] = [];
  errors.forEach(
    errorItem =>
      (errorItem as OperationError)?.isPublicError &&
      preppedErrors.push(
        extractExternalEndpointError(errorItem as OperationError)
      )
  );

  if (preppedErrors.length === 0) {
    const serverError = new ServerError();
    preppedErrors.push(extractExternalEndpointError(serverError));
  }

  return preppedErrors;
}

export function prepareResponseError(error: unknown) {
  let statusCode = kEndpointConstants.httpStatusCode.serverError;
  const errors = Array.isArray(error) ? error : [error];
  const preppedErrors = getPublicErrors(errors);

  if (errors.length > 0 && errors[0].statusCode) {
    statusCode = errors[0].statusCode;
  }

  return {statusCode, preppedErrors};
}

export const wrapEndpointREST = <EndpointType extends Endpoint>(
  endpoint: EndpointType,
  handleResponse?: ExportedHttpEndpoint_HandleResponse,
  handleError?: ExportedHttpEndpoint_HandleErrorFn,
  getData?: ExportedHttpEndpoint_GetDataFromReqFn,
  cleanup?: ExportedHttpEndpoint_Cleanup | Array<ExportedHttpEndpoint_Cleanup>
): ((req: Request, res: Response) => unknown) => {
  return async (req: Request, res: Response) => {
    await kIjxUtils.asyncLocalStorage().run(async () => {
      try {
        const data = await (getData ? getData(req) : req.body);
        const reqData = RequestData.fromExpressRequest(
          req as unknown as IServerRequest,
          data
        );

        const result = await endpoint(reqData);
        if (handleResponse) {
          await handleResponse(res, result, req, data);
        } else {
          res.status(kEndpointConstants.httpStatusCode.ok).json(result ?? {});
        }
      } catch (error: unknown) {
        try {
          kIjxUtils
            .logger()
            .log(`error with ${endpoint.name}, URL: ${req.url}`);

          kIjxUtils.logger().error(error);
          const {statusCode, preppedErrors} = prepareResponseError(error);
          if (handleError) {
            const deferHandling = handleError(res, preppedErrors, error);
            if (deferHandling !== true) {
              return;
            }
          }

          const result = {errors: preppedErrors};
          if (res.writable) {
            if (!res.headersSent) {
              res.status(statusCode).json(result);
            } else {
              res.end(JSON.stringify(result));
            }
          }
        } catch (serverError) {
          kIjxUtils.logger().error(serverError);
          res.end();
        }
      } finally {
        toCompactArray(cleanup).forEach(fn =>
          kIjxUtils.promises().callAndForget(() => fn(req, res))
        );
      }
    });
  };
};

export function throwNotFound() {
  throw new NotFoundError();
}

export type ResourceWithoutAssignedAgent<T> = Omit<
  T,
  'assignedAt' | 'assignedBy'
>;
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

export function endpointDecodeURIComponent(component?: unknown) {
  return component && isString(component)
    ? decodeURIComponent(component)
    : undefined;
}

export function getWorkspaceResourceListQuery00(
  workspace: Workspace,
  report: ResolvedTargetChildrenAccessCheck
) {
  if (report.access === kResolvedTargetChildrenAccess.full) {
    return {
      workspaceId: workspace.resourceId,
      excludeResourceIdList: report.partialDenyIds?.length
        ? report.partialDenyIds
        : undefined,
    };
  } else if (report.access === kResolvedTargetChildrenAccess.partial) {
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

export function assertUpdateNotEmpty(update: AnyObject) {
  appAssert(
    !isObjectEmpty(update),
    new InvalidRequestError('Update data provided is empty')
  );
}

export function registerExpressRouteFromEndpoint(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  endpoint: ExportedHttpEndpointWithMddocDefinition<any>,
  app: Express
) {
  const p = endpoint.mddocHttpDefinition.assertGetBasePathname();
  const expressPath = endpoint.mddocHttpDefinition.getPathParamaters()
    ? `${p}*`
    : p;
  app[endpoint.mddocHttpDefinition.assertGetMethod()](
    expressPath,
    ...compact([
      endpoint.expressRouteMiddleware,
      wrapEndpointREST(
        endpoint.fn,
        endpoint.handleResponse,
        endpoint.handleError,
        endpoint.getDataFromReq,
        endpoint.cleanup
      ),
    ])
  );
}

export function isResourceNameEqual(name01: string, name02: string) {
  return name01.toLowerCase() === name02.toLowerCase();
}
