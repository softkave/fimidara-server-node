import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';
import {NewAgentTokenInput} from '../addToken/types.js';

export type UpdateAgentTokenInput = Partial<NewAgentTokenInput>;

export interface UpdateAgentTokenEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  token: UpdateAgentTokenInput;
  shouldEncode?: boolean;
}

export interface UpdateAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type UpdateAgentTokenEndpoint = Endpoint<
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult
>;
