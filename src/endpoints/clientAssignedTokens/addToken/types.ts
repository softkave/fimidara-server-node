import {IPublicClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewClientAssignedTokenInput {
  providedResourceId?: string;
  name?: string;
  description?: string;
  expires?: string;
  permissionGroups?: IPermissionGroupInput[];
  tags?: IAssignedTagInput[];
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
