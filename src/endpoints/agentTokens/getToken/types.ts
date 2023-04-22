import {PublicAgentToken} from '../../../definitions/agentToken';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface GetAgentTokenEndpointParams extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export interface GetAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type GetAgentTokenEndpoint = Endpoint<
  BaseContextType,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult
>;
