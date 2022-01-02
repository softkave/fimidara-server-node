import OperationError from '../utilities/OperationError';
import RequestData from './RequestData';
import {IBaseContext} from './contexts/BaseContext';
import {SessionAgentType} from '../definitions/system';

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

export interface IPublicAgent {
  agentId: string;
  agentType: SessionAgentType;
}
