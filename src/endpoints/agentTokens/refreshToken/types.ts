import {EncodedAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint} from '../../types.js';

export interface RefreshAgentTokenEndpointParams {
  refreshToken: string;
}

export type RefreshAgentTokenEndpointResult = EncodedAgentToken;

export type RefreshAgentTokenEndpoint = Endpoint<
  RefreshAgentTokenEndpointParams,
  RefreshAgentTokenEndpointResult
>;
