import {PublicAgentToken} from '../../../definitions/agentToken';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface GetAgentTokenEndpointParams extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export interface GetAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type GetAgentTokenEndpoint = Endpoint<
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult
>;
