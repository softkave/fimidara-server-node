import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewClientAssignedTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expires?: string;
  permissionGroups?: IAssignPermissionGroupInput[];
  // tags?: IAssignedTagInput[];
}

export interface IAddClientAssignedTokenEndpointParams {
  workspaceId?: string;
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
