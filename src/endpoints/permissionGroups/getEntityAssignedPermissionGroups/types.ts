import {
  IAssignedPermissionGroupMeta,
  IPublicPermissionGroup,
} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IEndpointOptionalWorkspaceIDParam} from '../../types';

export interface IGetEntityAssignedPermissionGroupsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {
  entityId: string;
  includeInheritedPermissionGroups?: boolean;
}

export interface IGetEntityAssignedPermissionGroupsEndpointParams
  extends IGetEntityAssignedPermissionGroupsEndpointParamsBase {}

export interface IGetEntityAssignedPermissionGroupsEndpointResult {
  permissionGroups: IPublicPermissionGroup[];
  immediateAssignedPermissionGroupsMeta: IAssignedPermissionGroupMeta[];
}

export type GetEntityAssignedPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityAssignedPermissionGroupsEndpointParams,
  IGetEntityAssignedPermissionGroupsEndpointResult
>;
