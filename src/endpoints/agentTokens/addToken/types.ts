import {PublicAgentToken} from '../../../definitions/agentToken';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

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
