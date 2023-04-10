import {IPublicAgentToken} from '../../../definitions/agentToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointWorkspaceResourceParam} from '../../types';

export interface IGetAgentTokenEndpointParams extends IEndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export interface IGetAgentTokenEndpointResult {
  token: IPublicAgentToken;
}

export type GetAgentTokenEndpoint = Endpoint<
  IBaseContext,
  IGetAgentTokenEndpointParams,
  IGetAgentTokenEndpointResult
>;
