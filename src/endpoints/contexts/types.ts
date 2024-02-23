import {Request} from 'express';
import {BaseTokenData} from '../../definitions/system';

export interface IServerRequest extends Request {
  /** decoded JWT token using the expressJWT middleware */
  auth?: BaseTokenData;
}
