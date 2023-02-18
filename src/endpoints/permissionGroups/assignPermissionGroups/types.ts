import {IAssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface IAssignPermissionGroupsEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  permissionGroups: IAssignPermissionGroupInput[];
  entityId?: string;
  entityIdList?: string[];
}

export interface IAssignPermissionGroupsEndpointResult {}

export type AssignPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IAssignPermissionGroupsEndpointParams,
  IAssignPermissionGroupsEndpointResult
>;
