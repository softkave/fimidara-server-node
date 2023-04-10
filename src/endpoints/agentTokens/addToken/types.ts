import {IPublicAgentToken} from '../../../definitions/agentToken';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface INewAgentTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expires?: number;
  tags?: IAssignedTagInput[];
}

export interface IAddAgentTokenEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  token: INewAgentTokenInput;
}

export interface IAddAgentTokenEndpointResult {
  token: IPublicAgentToken;
}

export type AddAgentTokenEndpoint = Endpoint<
  IBaseContext,
  IAddAgentTokenEndpointParams,
  IAddAgentTokenEndpointResult
>;
