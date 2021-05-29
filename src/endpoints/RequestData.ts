import {IServerRequest} from './types';
import {IBaseUserTokenData} from './AccessToken';

export interface IRequestContructorParams<
    T = any,
    TokenData = IBaseUserTokenData
> {
    req: IServerRequest;
    data: T;
    tokenData?: TokenData;
    userAgent?: string;
    ips?: string[];
}

export default class RequestData<
    T = any,
    // eslint-disable-next-line @typescript-eslint/ban-types
    TokenData extends object = IBaseUserTokenData
> {
    public static fromExpressRequest<DataType>(
        req: IServerRequest,
        data?: DataType
    ): RequestData {
        const requestData = new RequestData({req, data});

        requestData.tokenData = req.user;
        requestData.ips =
            Array.isArray(req.ips) && req.ips.length > 0 ? req.ips : [req.ip];
        requestData.userAgent = req.headers['user-agent'];

        if (!requestData.data && req.body) {
            requestData.data = req.body;
        }

        return requestData;
    }

    public req: IServerRequest;
    public data: T;
    public tokenData?: TokenData | null;
    public userAgent?: string;
    public ips: string[];

    public constructor(arg: IRequestContructorParams<T, TokenData>) {
        this.req = arg.req;
        this.data = arg.data;
        this.tokenData = arg.tokenData;
        this.userAgent = arg.userAgent;
        this.ips = arg.ips || [];
    }
}
