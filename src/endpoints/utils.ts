import {Response, Request} from 'express';
import {IAgent, IPublicAccessOp} from '../definitions/system';
import {getDateString} from '../utilities/dateFns';
import {
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../utilities/extract';
import OperationError from '../utilities/OperationError';
import {endpointConstants} from './constants';
import {IBaseContext} from './contexts/BaseContext';
import {IServerRequest} from './contexts/types';
import {NotFoundError} from './errors';
import RequestData from './RequestData';
import {Endpoint, IPublicAgent, IRequestDataWork} from './types';

export function getPublicErrors(inputError: any) {
  const errors = Array.isArray(inputError) ? inputError : [inputError];

  // We are mapping errors cause some values don't show if we don't
  // or was it errors, not sure anymore, this is old code.
  // TODO: Feel free to look into it, cause it could help performance.
  const preppedErrors: Omit<OperationError, 'isPublicError' | 'statusCode'>[] =
    [];

  errors.forEach(
    errorItem =>
      errorItem?.isPublic &&
      preppedErrors.push({
        name: errorItem.name,
        message: errorItem.message,
        action: errorItem.action,
        field: errorItem.field,
      })
  );

  return preppedErrors;
}

export const wrapEndpointREST = <
  Context extends IBaseContext,
  EndpointType extends Endpoint<Context>
>(
  endpoint: EndpointType,
  context: Context,
  handleResponse?: (
    res: Response,
    result: Awaited<ReturnType<EndpointType>>
  ) => void,
  getData?: (req: Request) => Parameters<EndpointType>[1]['data']
): ((req: Request, res: Response) => any) => {
  return async (req: Request, res: Response) => {
    try {
      const data = getData ? getData(req) : req.body;
      const instData = RequestData.fromExpressRequest(
        req as unknown as IServerRequest,
        data
      );

      const result = await endpoint(context, instData);

      if (handleResponse) {
        handleResponse(res, result);
      } else {
        res.status(endpointConstants.httpStatusCode.ok).json(result || {});
      }
    } catch (error) {
      console.error(error);
      console.log('-- END');

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
});

export const publicAccessOpExtractor = makeExtract(publicAccessOpFields);
export const publicAccessOpExtractorIfPresent =
  makeExtractIfPresent(publicAccessOpFields);
export const publicAccessOpListExtractor =
  makeListExtract(publicAccessOpFields);

export async function waitForWorks(works: IRequestDataWork[]) {
  await Promise.all(
    works.map(item => {
      return item.promise;
    })
  );
}

export function throwNotFound() {
  throw new NotFoundError();
}

export type IResourceWithoutAssignedAgent<T> = Omit<
  T,
  'assignedAt' | 'assignedBy'
>;

export function withAssignedAgent<T extends object>(
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

export function withAssignedAgentList<T extends object>(
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
