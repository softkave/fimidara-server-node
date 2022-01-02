import {Request} from 'express';
import {IBaseTokenData} from './SessionContext';

export interface IServerRequest extends Request {
  // decoded JWT token using the expressJWT middleware
  user?: IBaseTokenData;
}
