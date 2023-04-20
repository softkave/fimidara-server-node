import {ExportedHttpEndpoint} from '../types';
import {AddPermissionGroupEndpoint} from './addPermissionGroup/types';
import {DeletePermissionGroupEndpoint} from './deletePermissionGroup/types';
import {GetPermissionGroupEndpoint} from './getPermissionGroup/types';
import {GetWorkspacePermissionGroupsEndpoint} from './getWorkspacePermissionGroups/types';
import {UpdatePermissionGroupEndpoint} from './udpatePermissionGroup/types';

export type PermissionGroupsExportedEndpoints = {
  addPermissionGroup: ExportedHttpEndpoint<AddPermissionGroupEndpoint>;
  deletePermissionGroup: ExportedHttpEndpoint<DeletePermissionGroupEndpoint>;
  getWorkspacePermissionGroups: ExportedHttpEndpoint<GetWorkspacePermissionGroupsEndpoint>;
  getPermissionGroup: ExportedHttpEndpoint<GetPermissionGroupEndpoint>;
  updatePermissionGroup: ExportedHttpEndpoint<UpdatePermissionGroupEndpoint>;
};
