import {ISessionAgent} from '../definitions/system';
import {IUser} from '../definitions/user';
import getNewId from '../utilities/getNewId';
import {IBaseTokenData} from './contexts/SessionContext';
import {IServerRequest} from './contexts/types';
import {IRequestDataPendingPromise} from './types';

export interface IRequestContructorParams<T = any> {
  req?: IServerRequest | null;
  data?: T;
  incomingTokenData?: IBaseTokenData | null;
  agent?: ISessionAgent | null;
  user?: IUser | null;
  pendingPromises?: IRequestDataPendingPromise[];
}

export default class RequestData<T = any> {
  public static fromExpressRequest<DataType = any>(
    req: IServerRequest,
    data?: DataType
  ): RequestData<DataType> {
    const requestData = new RequestData({
      req,
      data,
      incomingTokenData: req.user,
    });

    return requestData;
  }

  public static clone<T = undefined>(
    from: RequestData,
    data: T
  ): RequestData<T> {
    return new RequestData({
      data,
      req: from.req,
      incomingTokenData: from.incomingTokenData,
      agent: from.agent,
      user: from.user,
      pendingPromises: from.pendingPromises,
    });
  }

  public static merge<T>(from: RequestData, to: RequestData<T>) {
    return new RequestData<T>({
      req: from.req,
      data: to.data,
      incomingTokenData: from.incomingTokenData,
      agent: from.agent,
      user: from.user,
      pendingPromises: from.pendingPromises.concat(to.pendingPromises),
    });
  }

  public requestId: string;
  public req?: IServerRequest | null;
  public data?: T;
  public incomingTokenData?: IBaseTokenData | null;
  public user?: IUser | null;
  public agent?: ISessionAgent | null;
  public pendingPromises: IRequestDataPendingPromise[] = [];

  public constructor(arg?: IRequestContructorParams<T>) {
    this.requestId = getNewId();

    if (!arg) {
      return;
    }

    this.req = arg.req;
    this.data = arg.data;
    this.incomingTokenData = arg.incomingTokenData;
    this.agent = arg.agent;
    this.user = arg.user;

    if (arg.pendingPromises) {
      this.pendingPromises = arg.pendingPromises;
    }
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

  pushPendingPromise(pendingPromise: IRequestDataPendingPromise) {
    this.pendingPromises.push(pendingPromise);
  }

  pushNamelessPendingPromise(pendingPromise: Promise<any>) {
    this.pendingPromises.push({
      promise: pendingPromise,
      id: Date.now(),
    });
  }
}
