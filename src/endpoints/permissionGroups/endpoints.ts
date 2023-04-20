import addPermissionGroup from './addPermissionGroup/handler';
import deletePermissionGroup from './deletePermissionGroup/handler';
import {
  addPermissionGroupEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from './endpoints.mddoc';
import getPermissionGroup from './getPermissionGroup/handler';
import getWorkspacePermissionGroups from './getWorkspacePermissionGroups/handler';
import {PermissionGroupsExportedEndpoints} from './types';
import updatePermissionGroup from './udpatePermissionGroup/handler';

export const permissionGroupsExportedEndpoints: PermissionGroupsExportedEndpoints = {
  addPermissionGroup: {
    fn: addPermissionGroup,
    mddocHttpDefinition: addPermissionGroupEndpointDefinition,
  },
  deletePermissionGroup: {
    fn: deletePermissionGroup,
    mddocHttpDefinition: deletePermissionGroupEndpointDefinition,
  },
  getPermissionGroup: {
    fn: getPermissionGroup,
    mddocHttpDefinition: getPermissionGroupEndpointDefinition,
  },
  getWorkspacePermissionGroups: {
    fn: getWorkspacePermissionGroups,
    mddocHttpDefinition: getWorkspacePermissionGroupsEndpointDefinition,
  },
  updatePermissionGroup: {
    fn: updatePermissionGroup,
    mddocHttpDefinition: updatePermissionGroupEndpointDefinition,
  },
};
