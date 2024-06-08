import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface NewAgentTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expires?: number;
}

export interface AddAgentTokenEndpointParams extends EndpointOptionalWorkspaceIDParam {
  token: NewAgentTokenInput;
}

export interface AddAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type AddAgentTokenEndpoint = Endpoint<
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult
>;
