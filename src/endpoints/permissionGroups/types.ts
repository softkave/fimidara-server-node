import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddPermissionGroupEndpoint} from './addPermissionGroup/types';
import {AssignPermissionGroupsEndpoint} from './assignPermissionGroups/types';
import {CountWorkspacePermissionGroupsEndpoint} from './countWorkspacePermissionGroups/types';
import {DeletePermissionGroupEndpoint} from './deletePermissionGroup/types';
import {GetEntityAssignedPermissionGroupsEndpoint} from './getEntityAssignedPermissionGroups/types';
import {GetPermissionGroupEndpoint} from './getPermissionGroup/types';
import {GetWorkspacePermissionGroupsEndpoint} from './getWorkspacePermissionGroups/types';
import {UpdatePermissionGroupEndpoint} from './udpatePermissionGroup/types';
import {UnassignPermissionGroupsEndpoint} from './unassignPermissionGroups/types';

export type AddPermissionGroupHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddPermissionGroupEndpoint>;
export type DeletePermissionGroupHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeletePermissionGroupEndpoint>;
export type GetWorkspacePermissionGroupsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetWorkspacePermissionGroupsEndpoint>;
export type GetPermissionGroupHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetPermissionGroupEndpoint>;
export type UpdatePermissionGroupHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdatePermissionGroupEndpoint>;
export type CountWorkspacePermissionGroupsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CountWorkspacePermissionGroupsEndpoint>;
export type AssignPermissionGroupsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AssignPermissionGroupsEndpoint>;
export type UnassignPermissionGroupsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UnassignPermissionGroupsEndpoint>;
export type GetEntityAssignedPermissionGroupsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetEntityAssignedPermissionGroupsEndpoint>;

export type PermissionGroupsExportedEndpoints = {
  addPermissionGroup: AddPermissionGroupHttpEndpoint;
  deletePermissionGroup: DeletePermissionGroupHttpEndpoint;
  getWorkspacePermissionGroups: GetWorkspacePermissionGroupsHttpEndpoint;
  getPermissionGroup: GetPermissionGroupHttpEndpoint;
  updatePermissionGroup: UpdatePermissionGroupHttpEndpoint;
  countWorkspacePermissionGroups: CountWorkspacePermissionGroupsHttpEndpoint;
  assignPermissionGroups: AssignPermissionGroupsHttpEndpoint;
  unassignPermissionGroups: UnassignPermissionGroupsHttpEndpoint;
  getEntityAssignedPermissionGroups: GetEntityAssignedPermissionGroupsHttpEndpoint;
};
