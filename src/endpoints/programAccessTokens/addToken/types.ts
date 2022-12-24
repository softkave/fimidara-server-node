import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewProgramAccessTokenInput {
  name: string;
  description?: string;
  permissionGroups?: IAssignPermissionGroupInput[];
  // tags?: IAssignedTagInput[];
}

export interface IAddProgramAccessTokenEndpointParams {
  workspaceId?: string;
  token: INewProgramAccessTokenInput;
}

export interface IAddProgramAccessTokenEndpointResult {
  token: IPublicProgramAccessToken;
}

export type AddProgramAccessTokenEndpoint = Endpoint<
  IBaseContext,
  IAddProgramAccessTokenEndpointParams,
  IAddProgramAccessTokenEndpointResult
>;
