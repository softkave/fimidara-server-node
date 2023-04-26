import {Request, Response} from 'express';
import {defaultTo, isNumber, isString} from 'lodash';
import {
  IAgent,
  IPublicAgent,
  IPublicResource,
  IPublicWorkspaceResource,
} from '../definitions/system';
import {IWorkspace} from '../definitions/workspace';
import OperationError from '../utils/OperationError';
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
import {isObjectEmpty} from '../utils/fns';
import {reuseableErrors} from '../utils/reusableErrors';
import {AnyObject} from '../utils/types';
import RequestData from './RequestData';
import {endpointConstants} from './constants';
import {summarizeAgentPermissionItems} from './contexts/authorizationChecks/checkAuthorizaton';
import {getPage} from './contexts/data/utils';
import {executeWithMutationRunOptions} from './contexts/semantic/utils';
import {IBaseContext, IServerRequest} from './contexts/types';
import {InvalidRequestError, NotFoundError} from './errors';
import {logger} from './globalUtils';
import EndpointReusableQueries from './queries';
import {DeleteResourceCascadeFnsMap, Endpoint, IPaginationQuery} from './types';
import {PermissionDeniedError} from './user/errors';

export function getPublicErrors(inputError: any) {
  const errors: OperationError[] = Array.isArray(inputError) ? inputError : [inputError];

  // We are mapping errors cause some values don't show if we don't
  // or was it errors, not sure anymore, this is old code.
  // TODO: Feel free to look into it, cause it could help performance.
  const preppedErrors: Omit<OperationError, 'isPublicError' | 'statusCode'>[] = [];
  errors.forEach(
    errorItem =>
      errorItem?.isPublicError &&
      preppedErrors.push({
        name: errorItem.name,
        message: errorItem.message,
        action: errorItem.action,
        field: errorItem.field,
      })
  );

  if (preppedErrors.length === 0) {
    const serverError = new ServerError();
    preppedErrors.push({name: serverError.name, message: serverError.message});
  }

  return preppedErrors;
}

export const wrapEndpointREST = <
  Context extends IBaseContext,
  EndpointType extends Endpoint<Context>
>(
  endpoint: EndpointType,
  context: Context,
  handleResponse?: (res: Response, result: Awaited<ReturnType<EndpointType>>) => void,
  getData?: (req: Request) => Parameters<EndpointType>[1]['data']
): ((req: Request, res: Response) => any) => {
  return async (req: Request, res: Response) => {
    try {
      const data = getData ? getData(req) : req.body;
      const instData = RequestData.fromExpressRequest(req as unknown as IServerRequest, data);
      const result = await endpoint(context, instData);
      if (handleResponse) {
        handleResponse(res, result);
      } else {
        res.status(endpointConstants.httpStatusCode.ok).json(result ?? {});
      }
    } catch (error) {
      logger.error(error);
      let statusCode = endpointConstants.httpStatusCode.serverError;
      const errors = Array.isArray(error) ? error : [error];
      const preppedErrors = getPublicErrors(errors);
      const result = {errors: preppedErrors};
      if (errors.length > 0 && errors[0].statusCode) {
        statusCode = errors[0].statusCode;
      }

      res.status(statusCode).json(result);
    }
  };
};

const agentPublicFields = getFields<IPublicAgent>({
  agentId: true,
  agentType: true,
});

export const agentExtractor = makeExtract(agentPublicFields);
export const agentExtractorIfPresent = makeExtractIfPresent(agentPublicFields);
export const agentListExtractor = makeListExtract(agentPublicFields);

export const resourceFields: ExtractFieldsFrom<IPublicResource> = {
  resourceId: true,
  createdAt: true,
  lastUpdatedAt: true,
};
export const workspaceResourceFields: ExtractFieldsFrom<IPublicWorkspaceResource> = {
  ...resourceFields,
  providedResourceId: true,
  workspaceId: true,
  createdBy: agentExtractor,
  lastUpdatedBy: agentExtractor,
};

export function throwNotFound() {
  throw new NotFoundError();
}

export function throwAgentTokenNotFound() {
  throw reuseableErrors.agentToken.notFound();
}

export type IResourceWithoutAssignedAgent<T> = Omit<T, 'assignedAt' | 'assignedBy'>;
type AssignedAgent = {
  assignedBy: IAgent;
  assignedAt: number;
};

export function withAssignedAgent<T extends AnyObject>(agent: IAgent, item: T): T & AssignedAgent {
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
  agent: IAgent,
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

export function endpointDecodeURIComponent(d?: any) {
  return d && isString(d) ? decodeURIComponent(d) : undefined;
}

export function getEndpointPageFromInput(p: IPaginationQuery, defaultPage = 0): number {
  return defaultTo(getPage(p.page), defaultPage);
}

export function getWorkspaceResourceListQuery(
  workspace: IWorkspace,
  permissionsSummaryReport: Awaited<ReturnType<typeof summarizeAgentPermissionItems>>
) {
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    return EndpointReusableQueries.getByWorkspaceIdAndExcludeResourceIdList(
      workspace.resourceId,
      permissionsSummaryReport.deniedResourceIdList
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    return EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(
      workspace.resourceId,
      permissionsSummaryReport.allowedResourceIdList
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  appAssert(false, new ServerError(), 'Control flow should not get here.');
}

export function getWorkspaceResourceListQuery00(
  workspace: IWorkspace,
  permissionsSummaryReport: Awaited<ReturnType<typeof summarizeAgentPermissionItems>>
) {
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    return {
      workspaceId: workspace.resourceId,
      excludeResourceIdList: permissionsSummaryReport.deniedResourceIdList?.length
        ? permissionsSummaryReport.deniedResourceIdList
        : undefined,
    };
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    return {
      workspaceId: workspace.resourceId,
      resourceIdList: permissionsSummaryReport.allowedResourceIdList.length
        ? permissionsSummaryReport.allowedResourceIdList
        : undefined,
    };
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  appAssert(false, new ServerError(), 'Control flow should not get here.');
}

export function applyDefaultEndpointPaginationOptions(data: IPaginationQuery) {
  if (!isNumber(data.page)) {
    data.page = endpointConstants.minPage;
  }
  if (!isNumber(data.pageSize)) {
    data.pageSize = endpointConstants.maxPageSize;
  }
  return data;
}

export async function executeCascadeDelete<Args>(
  context: IBaseContext,
  cascadeDef: DeleteResourceCascadeFnsMap<Args>,
  args: Args
) {
  await Promise.all(
    Object.values(cascadeDef).map(fn =>
      executeWithMutationRunOptions(context, opts => fn(context, args, opts))
    )
  );
}

export function assertUpdateNotEmpty(update: AnyObject) {
  appAssert(!isObjectEmpty(update), new InvalidRequestError('Update data provided is empty.'));
}
