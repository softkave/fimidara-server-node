import {
  IPermissionGroupInput,
  IPublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewPermissionGroupInput {
  name: string;
  description?: string;
  permissionGroups?: IPermissionGroupInput[];
  tags?: IAssignedTagInput[];
}

export interface IAddPermissionGroupEndpointParams {
  workspaceId?: string;
  permissionGroup: INewPermissionGroupInput;
}

export interface IAddPermissionGroupEndpointResult {
  permissionGroup: IPublicPermissionGroup;
}

export type AddPermissionGroupEndpoint = Endpoint<
  IBaseContext,
  IAddPermissionGroupEndpointParams,
  IAddPermissionGroupEndpointResult
>;
