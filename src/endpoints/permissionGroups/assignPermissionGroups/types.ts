import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface AssignPermissionGroupsEndpointParams extends EndpointOptionalWorkspaceIDParam {
  permissionGroups: AssignPermissionGroupInput[];
  entityId: string | string[];
}

export type AssignPermissionGroupsEndpoint = Endpoint<
  BaseContextType,
  AssignPermissionGroupsEndpointParams
>;
