import {IAssignPermissionGroupInput, IPublicPermissionGroup} from '../../../definitions/permissionGroups';
import {IAssignedTagInput} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface INewPermissionGroupInput {
  name: string;
  description?: string;
  permissionGroups?: IAssignPermissionGroupInput[];
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
