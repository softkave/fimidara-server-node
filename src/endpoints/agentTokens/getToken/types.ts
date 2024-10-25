import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types.js';

export interface GetAgentTokenEndpointParams
  extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
  shouldEncode?: boolean;
}

export interface GetAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type GetAgentTokenEndpoint = Endpoint<
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult
>;
