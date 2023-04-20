import {ExportedHttpEndpoint} from '../types';
import {AddPermissionGroupEndpoint} from './addPermissionGroup/types';
import {AssignPermissionGroupsEndpoint} from './assignPermissionGroups/types';
import {CountWorkspacePermissionGroupsEndpoint} from './countWorkspacePermissionGroups/types';
import {DeletePermissionGroupEndpoint} from './deletePermissionGroup/types';
import {GetEntityAssignedPermissionGroupsEndpoint} from './getEntityAssignedPermissionGroups/types';
import {GetPermissionGroupEndpoint} from './getPermissionGroup/types';
import {GetWorkspacePermissionGroupsEndpoint} from './getWorkspacePermissionGroups/types';
import {UpdatePermissionGroupEndpoint} from './udpatePermissionGroup/types';

export type PermissionGroupsExportedEndpoints = {
  addPermissionGroup: ExportedHttpEndpoint<AddPermissionGroupEndpoint>;
  deletePermissionGroup: ExportedHttpEndpoint<DeletePermissionGroupEndpoint>;
  getWorkspacePermissionGroups: ExportedHttpEndpoint<GetWorkspacePermissionGroupsEndpoint>;
  getPermissionGroup: ExportedHttpEndpoint<GetPermissionGroupEndpoint>;
  updatePermissionGroup: ExportedHttpEndpoint<UpdatePermissionGroupEndpoint>;
  countWorkspacePermissionGroups: ExportedHttpEndpoint<CountWorkspacePermissionGroupsEndpoint>;
  assignPermissionGroups: ExportedHttpEndpoint<AssignPermissionGroupsEndpoint>;
  getEntityAssignedPermissionGroups: ExportedHttpEndpoint<GetEntityAssignedPermissionGroupsEndpoint>;
};
