import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface NewAgentTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expiresAt?: number;
  shouldRefresh?: boolean;
  refreshDuration?: number;
}

export interface AddAgentTokenEndpointParams
  extends EndpointOptionalWorkspaceIDParam,
    NewAgentTokenInput {
  shouldEncode?: boolean;
}

export interface AddAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type AddAgentTokenEndpoint = Endpoint<
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult
>;
