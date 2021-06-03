import {Request} from 'express';

export interface IServerRequest extends Request {
    // decoded JWT token using the expressJWT middleware
    user?: IBaseTokenData;
}
