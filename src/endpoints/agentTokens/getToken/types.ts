import {PublicAgentToken} from '../../../definitions/agentToken';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface GetAgentTokenEndpointParams extends EndpointWorkspaceResourceParam {
  tokenId?: string;
  onReferenced?: boolean;
}

export interface GetAgentTokenEndpointResult {
  token: PublicAgentToken;
}

export type GetAgentTokenEndpoint = Endpoint<
  BaseContext,
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult
>;
