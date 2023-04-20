import {PublicAgentToken} from '../../../definitions/agentToken';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export type UpdateAgentTokenInput = Partial<NewAgentTokenInput>;

export interface UpdateAgentTokenEndpointParams extends EndpointOptionalWorkspaceIDParam {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  token: UpdateAgentTokenInput;
}

export interface UpdateAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type UpdateAgentTokenEndpoint = Endpoint<
  BaseContext,
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult
>;
