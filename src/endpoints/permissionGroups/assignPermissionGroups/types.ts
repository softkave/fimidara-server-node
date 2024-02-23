import {AssignPermissionGroupInput} from '../../../definitions/permissionGroups';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface AssignPermissionGroupsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  permissionGroups: AssignPermissionGroupInput[];
  entityId: string | string[];
}

export type AssignPermissionGroupsEndpoint =
  Endpoint<AssignPermissionGroupsEndpointParams>;
