import OperationError from '../utilities/OperationError';
import RequestData from './RequestData';
import {Request} from 'express';
import {IUser} from '../definitions/user';
import {IBaseContext} from './contexts/BaseContext';
import {IBaseTokenData} from './contexts/ProgramAccessTokenContext';

export interface IServerRequest extends Request {
    user?: IBaseTokenData; // coming from the JWT middleware
    appUserData?: IUser | null;
}

export interface IBaseEndpointResult {
    errors?: OperationError[];
}

export type Endpoint<
    Context extends IBaseContext = IBaseContext,
    Data = any,
    Result = any
> = (
    context: Context,
    instData: RequestData<Data>
) => Promise<Result & IBaseEndpointResult>;

export enum ServerRecommendedActions {
    LoginAgain = 'LoginAgain',
    Logout = 'Logout',
}
