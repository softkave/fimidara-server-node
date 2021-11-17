import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {ISessionAgent} from '../definitions/system';
import {IUser} from '../definitions/user';
import {IUserToken} from '../definitions/userToken';
import {IBaseContext} from './contexts/BaseContext';
import {IBaseTokenData} from './contexts/ProgramAccessTokenContext';
import {IServerRequest} from './contexts/types';

export interface IRequestContructorParams<T = any> {
  req?: IServerRequest | null;
  data?: T;
  incomingTokenData?: IBaseTokenData | null;
  userToken?: IUserToken | null;
  programAccessToken?: IProgramAccessToken | null;
  clientAssignedToken?: IClientAssignedToken | null;
  userAgent?: string;
  ips?: string[];
  user?: IUser | null;
  metaCache?: Record<string, any> | null;
}

export default class RequestData<T = any> {
  public static fromExpressRequest<DataType>(
    req: IServerRequest,
    data?: DataType
  ): RequestData {
    const requestData = new RequestData({
      req,
      data,
      ips: Array.isArray(req.ips) && req.ips.length > 0 ? req.ips : [req.ip],
      userAgent: req.headers['user-agent'],
      incomingTokenData: req.user,
    });

    return requestData;
  }

  public static clone(from: RequestData): RequestData {}

  public static merge(from: RequestData, to: RequestData): RequestData {}

  public req?: IServerRequest | null;
  public data?: T;
  public incomingTokenData?: IBaseTokenData | null;
  public userToken?: IUserToken | null;
  public programAccessToken?: IProgramAccessToken | null;
  public clientAssignedToken?: IClientAssignedToken | null;
  public userAgent?: string;
  public ips: string[] = [];
  public user?: IUser | null;
  public metaCache?: Record<string, any> | null;
  public agent?: ISessionAgent | null;

  public constructor(arg?: IRequestContructorParams<T>) {
    if (!arg) {
      return;
    }

    this.req = arg.req;
    this.data = arg.data;
    this.userToken = arg.userToken;
    this.programAccessToken = arg.programAccessToken;
    this.clientAssignedToken = arg.clientAssignedToken;
    this.incomingTokenData = arg.incomingTokenData;
    this.userAgent = arg.userAgent;

    if (arg.ips) {
      this.ips = arg.ips;
    }

    this.user = arg.user;
    this.metaCache = arg.metaCache;
  }
}
