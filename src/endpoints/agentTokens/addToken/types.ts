import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface NewAgentTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expiresAt?: number;
  shouldRefresh?: boolean;
  shouldEncode?: boolean;
  refreshDuration?: number;
}

export interface AddAgentTokenEndpointParams
  extends EndpointOptionalWorkspaceIDParam,
    NewAgentTokenInput {}

export interface AddAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type AddAgentTokenEndpoint = Endpoint<
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult
>;
