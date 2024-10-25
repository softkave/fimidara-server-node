import {EncodedAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types.js';

export interface EncodeAgentTokenEndpointParams
  extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export type EncodeAgentTokenEndpointResult = EncodedAgentToken;

export type EncodeAgentTokenEndpoint = Endpoint<
  EncodeAgentTokenEndpointParams,
  EncodeAgentTokenEndpointResult
>;
