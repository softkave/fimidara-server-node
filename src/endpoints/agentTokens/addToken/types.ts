import {PublicAgentToken} from '../../../definitions/agentToken';
import {BaseContext} from '../../contexts/types';
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
  BaseContext,
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult
>;
