import OperationError from '../utilities/OperationError';
import RequestData from './RequestData';
import {Request} from 'express';
import {IUser} from '../definitions/user';
import {IBaseContext} from './BaseContext';
import {IBaseUserTokenData} from './AccessToken';

export interface IServerRequest extends Request {
    user?: IBaseUserTokenData; // coming from the JWT middleware
    appUserData?: IUser | null;
}

export interface IBaseEndpointResult {
    errors?: OperationError[];
}

export type Endpoint<
    Context extends IBaseContext = IBaseContext,
    Data = any,
    Result = any,
    // eslint-disable-next-line @typescript-eslint/ban-types
    TokenData extends object = any
> = (
    context: Context,
    instData: RequestData<Data, TokenData>
) => Promise<(Result & IBaseEndpointResult) | undefined>;

export enum JWTEndpoints {
    ChangePassword = 'ChangePassword',
    Login = 'Login',
    Global = '*',
}

export enum ServerRecommendedActions {
    LoginAgain = 'LoginAgain',
    Logout = 'Logout',
}
