import {
  IPublicAssignedPermissionGroupMeta,
  IPublicPermissionGroupWithAssignedPermissionGroupsMeta,
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
  permissionGroups: IPublicPermissionGroupWithAssignedPermissionGroupsMeta[];
  immediateAssignedPermissionGroupsMeta: IPublicAssignedPermissionGroupMeta[];
}

export type GetEntityAssignedPermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityAssignedPermissionGroupsEndpointParams,
  IGetEntityAssignedPermissionGroupsEndpointResult
>;
