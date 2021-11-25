import {IClientAssignedToken} from '../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../definitions/programAccessToken';
import {ISessionAgent} from '../definitions/system';
import {IUser} from '../definitions/user';
import {IUserToken} from '../definitions/userToken';
import {IBaseTokenData} from './contexts/SessionContext';
import {IServerRequest} from './contexts/types';

export interface IRequestContructorParams<T = any> {
  req?: IServerRequest | null;
  data?: T;
  incomingTokenData?: IBaseTokenData | null;
  userToken?: IUserToken | null;
  programAccessToken?: IProgramAccessToken | null;
  clientAssignedToken?: IClientAssignedToken | null;
  agent?: ISessionAgent | null;
  user?: IUser | null;
}

export default class RequestData<T = any> {
  public static fromExpressRequest<DataType>(
    req: IServerRequest,
    data?: DataType
  ): RequestData {
    const requestData = new RequestData({
      req,
      data,
      incomingTokenData: req.user,
    });

    return requestData;
  }

  public static clone(from: RequestData): RequestData {}

  public static merge(from: RequestData, to: RequestData) {}

  public req?: IServerRequest | null;
  public data?: T;
  public incomingTokenData?: IBaseTokenData | null;
  public userToken?: IUserToken | null;
  public programAccessToken?: IProgramAccessToken | null;
  public clientAssignedToken?: IClientAssignedToken | null;
  public user?: IUser | null;
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
    this.agent = arg.agent;
    this.user = arg.user;
  }

  getIp() {
    if (this.req) {
      return Array.isArray(this.req.ips) && this.req.ips.length > 0
        ? this.req.ips
        : [this.req.ip];
    }

    return [];
  }

  getUserAgent() {
    if (this.req) {
      return this.req.headers['user-agent'];
    }

    return null;
  }
}
