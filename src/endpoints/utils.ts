import {Response, Request} from 'express';
import {IBaseContext} from './contexts/BaseContext';
import RequestData from './RequestData';
import {Endpoint, IServerRequest} from './types';

export const wrapEndpointREST = <Context extends IBaseContext>(
    endpoint: Endpoint<Context>,
    context: Context
): ((req: Request, res: Response) => any) => {
    return async (req: Request, res: Response) => {
        try {
            const data = req.body;
            const instData = await RequestData.fromExpressRequest(
                context,
                (req as unknown) as IServerRequest,
                data
            );

            const result = await endpoint(context, instData);
            res.status(200).json(result || {});
        } catch (error) {
            const errors = Array.isArray(error) ? error : [error];

            // TODO: move to winston
            console.error(error);
            console.log(); // for spacing

            // We are mapping it cause some values don't show if we don't
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
