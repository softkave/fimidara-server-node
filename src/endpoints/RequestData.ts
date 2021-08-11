import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {IUser} from '../definitions/user';
import {IUserToken} from '../definitions/userToken';
import {IBaseContext} from './contexts/BaseContext';
import {IBaseTokenData} from './contexts/ProgramAccessTokenContext';
import {IServerRequest} from './contexts/types';

export interface IRequestContructorParams<T = any> {
    req?: IServerRequest | null;
    data?: T;
    incomingTokenData?: IBaseTokenData | null;
    userTokenData?: IUserToken | null;
    programAccessTokenData?: IProgramAccessToken | null;
    clientAssignedTokenData?: IClientAssignedToken | null;
    userAgent?: string;
    ips?: string[];
    user?: IUser | null;
    internalData?: Record<string, any> | null;
}

export default class RequestData<T = any> {
    public static async fromExpressRequest<DataType>(
        ctx: IBaseContext,
        req: IServerRequest,
        data?: DataType
    ): Promise<RequestData> {
        const requestData = new RequestData({
            req,
            data,
            ips:
                Array.isArray(req.ips) && req.ips.length > 0
                    ? req.ips
                    : [req.ip],
            userAgent: req.headers['user-agent'],
            incomingTokenData: req.user,
        });

        return requestData;
    }

    public req?: IServerRequest | null;
    public data?: T;
    public incomingTokenData?: IBaseTokenData | null;
    public userTokenData?: IUserToken | null;
    public programAccessTokenData?: IProgramAccessToken | null;
    public clientAssignedTokenData?: IClientAssignedToken | null;
    public userAgent?: string;
    public ips: string[] = [];
    public user?: IUser | null;
    public internalData?: Record<string, any> | null;

    public constructor(arg?: IRequestContructorParams<T>) {
        if (!arg) {
            return;
        }

        this.req = arg.req;
        this.data = arg.data;
        this.userTokenData = arg.userTokenData;
        this.programAccessTokenData = arg.programAccessTokenData;
        this.clientAssignedTokenData = arg.clientAssignedTokenData;
        this.incomingTokenData = arg.incomingTokenData;
        this.userAgent = arg.userAgent;

        if (arg.ips) {
            this.ips = arg.ips;
        }

        this.user = arg.user;
        this.internalData = arg.internalData;
    }
}
