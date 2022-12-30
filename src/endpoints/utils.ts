import {Request, Response} from 'express';
import {isString} from 'lodash';
import {IAgent, IPublicAccessOp} from '../definitions/system';
import {getDateString} from '../utils/dateFns';
import {ServerError} from '../utils/errors';
import {getFields, makeExtract, makeExtractIfPresent, makeListExtract} from '../utils/extract';
import OperationError from '../utils/OperationError';
import {AnyObject} from '../utils/types';
import {endpointConstants} from './constants';
import {IBaseContext, IServerRequest} from './contexts/types';
import {NotFoundError} from './errors';
import RequestData from './RequestData';
import {Endpoint, IPublicAgent, IRequestDataPendingPromise} from './types';

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

export const wrapEndpointREST = <Context extends IBaseContext, EndpointType extends Endpoint<Context>>(
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
        res.status(endpointConstants.httpStatusCode.ok).json(result || {});
      }
    } catch (error) {
      context.logger.error(error);
      let statusCode = endpointConstants.httpStatusCode.serverError;
      const errors = Array.isArray(error) ? error : [error];
      const preppedErrors = getPublicErrors(errors);
      const result = {
        errors: preppedErrors,
      };

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

const publicAccessOpFields = getFields<IPublicAccessOp>({
  action: true,
  markedAt: getDateString,
  markedBy: agentExtractor,
  resourceType: true,
  appliesTo: true,
});

export const publicAccessOpExtractor = makeExtract(publicAccessOpFields);
export const publicAccessOpExtractorIfPresent = makeExtractIfPresent(publicAccessOpFields);
export const publicAccessOpListExtractor = makeListExtract(publicAccessOpFields);

export async function waitForWorks(works: IRequestDataPendingPromise[]) {
  await Promise.all(
    works.map(item => {
      return item.promise;
    })
  );
}

export function throwNotFound() {
  throw new NotFoundError();
}

export type IResourceWithoutAssignedAgent<T> = Omit<T, 'assignedAt' | 'assignedBy'>;

export function withAssignedAgent<T extends AnyObject>(
  agent: IAgent,
  item: T
): T & {assignedBy: IAgent; assignedAt: string} {
  return {
    ...item,
    assignedAt: getDateString(),
    assignedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };
}

export function withAssignedAgentList<T extends AnyObject>(
  agent: IAgent,
  items: T[] = []
): Array<T & {assignedBy: IAgent; assignedAt: string}> {
  return items.map(item => ({
    ...item,
    assignedAt: getDateString(),
    assignedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  }));
}

export function endpointDecodeURIComponent(d?: any) {
  return d && isString(d) ? decodeURIComponent(d) : undefined;
}
