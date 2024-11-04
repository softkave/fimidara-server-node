import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {AddPermissionGroupEndpoint} from './addPermissionGroup/types.js';
import {AddPermissionItemsEndpoint} from './addPermissionItems/types.js';
import {AssignPermissionGroupsEndpoint} from './assignPermissionGroups/types.js';
import {CountWorkspacePermissionGroupsEndpoint} from './countPermissionGroups/types.js';
import {DeletePermissionGroupEndpoint} from './deletePermissionGroup/types.js';
import {DeletePermissionItemsEndpoint} from './deletePermissionItems/types.js';
import {GetEntityAssignedPermissionGroupsEndpoint} from './getAssignedPermissionGroups/types.js';
import {GetPermissionGroupEndpoint} from './getPermissionGroup/types.js';
import {GetWorkspacePermissionGroupsEndpoint} from './getPermissionGroups/types.js';
import {ResolveEntityPermissionsEndpoint} from './resolvePermissions/types.js';
import {UnassignPermissionGroupsEndpoint} from './unassignPermissionGroups/types.js';
import {UpdatePermissionGroupEndpoint} from './updatePermissionGroup/types.js';

export interface PermissionItemInputTarget {
  targetId?: string | string[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export interface ResolvedEntityPermissionItemTarget {
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}

export interface PermissionItemInput extends PermissionItemInputTarget {
  action: FimidaraPermissionAction | FimidaraPermissionAction[];
  access: boolean;
  entityId: string | string[];
}

export type AddPermissionItemsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddPermissionItemsEndpoint>;
export type DeletePermissionItemsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeletePermissionItemsEndpoint>;
export type ResolveEntityPermissionsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ResolveEntityPermissionsEndpoint>;
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

export type PermissionItemsExportedEndpoints = {
  addItems: AddPermissionItemsHttpEndpoint;
  deleteItems: DeletePermissionItemsHttpEndpoint;
  resolveEntityPermissions: ResolveEntityPermissionsHttpEndpoint;
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
