import {PublicAgentToken} from '../../../definitions/agentToken';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {NewAgentTokenInput} from '../addToken/types';

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
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult
>;
