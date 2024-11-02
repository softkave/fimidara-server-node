import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

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
  extends EndpointOptionalWorkspaceIdParam,
    NewAgentTokenInput {}

export interface AddAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type AddAgentTokenEndpoint = Endpoint<
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult
>;
