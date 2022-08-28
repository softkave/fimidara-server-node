import {IPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IPublicProgramAccessToken} from '../../../definitions/programAccessToken';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewProgramAccessTokenInput {
  name: string;
  description?: string;
  permissionGroups?: IPermissionGroupInput[];
  tags?: IAssignedTagInput[];
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
