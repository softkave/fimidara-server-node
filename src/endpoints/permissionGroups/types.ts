import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddPermissionGroupEndpoint} from './addPermissionGroup/types.js';
import {AssignPermissionGroupsEndpoint} from './assignPermissionGroups/types.js';
import {CountWorkspacePermissionGroupsEndpoint} from './countWorkspacePermissionGroups/types.js';
import {DeletePermissionGroupEndpoint} from './deletePermissionGroup/types.js';
import {GetEntityAssignedPermissionGroupsEndpoint} from './getEntityAssignedPermissionGroups/types.js';
import {GetPermissionGroupEndpoint} from './getPermissionGroup/types.js';
import {GetWorkspacePermissionGroupsEndpoint} from './getWorkspacePermissionGroups/types.js';
import {UpdatePermissionGroupEndpoint} from './udpatePermissionGroup/types.js';
import {UnassignPermissionGroupsEndpoint} from './unassignPermissionGroups/types.js';

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
