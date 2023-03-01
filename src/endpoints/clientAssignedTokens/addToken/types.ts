import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface INewClientAssignedTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expires?: number;
  tags?: IAssignedTagInput[];
}

export interface IAddClientAssignedTokenEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  token: INewClientAssignedTokenInput;
}

export interface IAddClientAssignedTokenEndpointResult {
  token: IPublicClientAssignedToken;
}

export type AddClientAssignedTokenEndpoint = Endpoint<
  IBaseContext,
  IAddClientAssignedTokenEndpointParams,
  IAddClientAssignedTokenEndpointResult
>;
