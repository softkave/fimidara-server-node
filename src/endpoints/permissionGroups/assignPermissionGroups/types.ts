import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface AssignPermissionGroupsEndpointParams extends EndpointOptionalWorkspaceIDParam {
  permissionGroups: AssignPermissionGroupInput[];
  entityId: string | string[];
}

export type AssignPermissionGroupsEndpoint = Endpoint<
  BaseContext,
  AssignPermissionGroupsEndpointParams
>;
