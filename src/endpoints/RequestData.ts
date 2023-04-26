import {AppResourceType, BaseTokenData, SessionAgent} from '../definitions/system';
import {User} from '../definitions/user';
import {getNewIdForResource} from '../utils/resource';
import {IServerRequest} from './contexts/types';

export interface IRequestContructorParams<T = any> {
  req?: IServerRequest | null;
  data?: T;
  incomingTokenData?: BaseTokenData | null;
  agent?: SessionAgent | null;
  user?: User | null;
}

export default class RequestData<T = any> {
  static fromExpressRequest(req: IServerRequest): RequestData<{}>;
  static fromExpressRequest<DataType = any>(
    req: IServerRequest,
    data: DataType
  ): RequestData<DataType>;
  static fromExpressRequest<DataType = any>(
    ...args: [IServerRequest] | [IServerRequest, DataType]
  ): RequestData<DataType> {
    const [req, data] = args;
    const requestData = new RequestData({
      req,
      data,
      incomingTokenData: req.auth,
    });

    return requestData;
  }

  static clone<T = undefined>(from: RequestData, data: T): RequestData<T> {
    return new RequestData({
      data,
      req: from.req,
      incomingTokenData: from.incomingTokenData,
      agent: from.agent,
      user: from.user,
    });
  }

  static merge<T>(from: RequestData, to: RequestData<T>) {
    return new RequestData<T>({
      req: from.req,
      data: to.data,
      incomingTokenData: from.incomingTokenData,
      agent: from.agent,
      user: from.user,
    });
  }

  requestId: string;
  req?: IServerRequest | null;
  data?: T;
  incomingTokenData?: BaseTokenData | null;
  user?: User | null;
  agent?: SessionAgent | null;

  constructor(arg?: IRequestContructorParams<T>) {
    this.requestId = getNewIdForResource(AppResourceType.EndpointRequest);
    if (!arg) return;

    this.req = arg.req;
    this.data = arg.data;
    this.incomingTokenData = arg.incomingTokenData;
    this.agent = arg.agent;
    this.user = arg.user;
  }

  getIp() {
    if (this.req)
      return Array.isArray(this.req.ips) && this.req.ips.length > 0 ? this.req.ips : [this.req.ip];
    return [];
  }

  getUserAgent() {
    if (this.req) return this.req.headers['user-agent'];
    return null;
  }
}
