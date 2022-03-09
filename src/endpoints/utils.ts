import {Response, Request} from 'express';
import {IPublicAccessOp} from '../definitions/system';
import {getDateString} from '../utilities/dateFns';
import {
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../utilities/extract';
import cast from '../utilities/fns';
import OperationError from '../utilities/OperationError';
import {IBaseContext} from './contexts/BaseContext';
import {IServerRequest} from './contexts/types';
import {NotFoundError} from './errors';
import RequestData from './RequestData';
import {Endpoint, IPublicAgent, IRequestDataWork} from './types';

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
        res.status(200).json(result || {});
      }
    } catch (error) {
      const errors = Array.isArray(error) ? error : [error];

      // TODO: move to winston
      console.error(error);
      console.log(); // for spacing

      // We are mapping errors cause some values don't show if we don't
      // or was it errors, not sure anymore, this is old code.
      // TODO: Feel free to look into it, cause it could help performance.
      const preppedErrors: Omit<OperationError, 'isPublic'>[] = [];
      cast<OperationError[]>(errors).forEach(
        err =>
          err.isPublic &&
          preppedErrors.push({
            name: err.name,
            message: err.message,
            action: err.action,
            field: err.field,
          })
      );

      const result = {
        errors: preppedErrors,
      };

      res.status(500).json(result);
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
