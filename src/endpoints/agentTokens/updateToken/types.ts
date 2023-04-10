import {IPublicAgentToken} from '../../../definitions/agentToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';
import {INewAgentTokenInput} from '../addToken/types';

export type IUpdateAgentTokenInput = Partial<INewAgentTokenInput>;

export interface IUpdateAgentTokenEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  token: IUpdateAgentTokenInput;
}

export interface IUpdateAgentTokenEndpointResult {
  token: IPublicAgentToken;
}

export type UpdateAgentTokenEndpoint = Endpoint<
  IBaseContext,
  IUpdateAgentTokenEndpointParams,
  IUpdateAgentTokenEndpointResult
>;
