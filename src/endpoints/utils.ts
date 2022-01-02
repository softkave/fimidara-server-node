import {Response, Request} from 'express';
import {getFields, makeExtract, makeListExtract} from '../utilities/extract';
import {IBaseContext} from './contexts/BaseContext';
import {IServerRequest} from './contexts/types';
import RequestData from './RequestData';
import {Endpoint, IPublicAgent} from './types';

export const wrapEndpointREST = <
  Context extends IBaseContext,
  EndpointType extends Endpoint<Context>
>(
  endpoint: EndpointType,
  context: Context,
  handleResponse?: (
    res: Response,
    result: Awaited<ReturnType<EndpointType>>
  ) => void
): ((req: Request, res: Response) => any) => {
  return async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const instData = RequestData.fromExpressRequest(
        (req as unknown) as IServerRequest,
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
      const result = {
        errors: errors.map(err => ({
          name: err.name,
          message: err.message,
          action: err.action,
          field: err.field,
        })),
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
export const agentListExtractor = makeListExtract(agentPublicFields);
