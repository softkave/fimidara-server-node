import addPermissionGroup from './addPermissionGroup/handler';
import assignPermissionGroups from './assignPermissionGroups/handler';
import countWorkspacePermissionGroups from './countWorkspacePermissionGroups/handler';
import deletePermissionGroup from './deletePermissionGroup/handler';
import {
  addPermissionGroupEndpointDefinition,
  assignPermissionGroupsEndpointDefinition,
  countWorkspacePermissionGroupsEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  getEntityAssignedPermissionGroupsEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from './endpoints.mddoc';
import getEntityAssignedPermissionGroups from './getEntityAssignedPermissionGroups/handler';
import getPermissionGroup from './getPermissionGroup/handler';
import getWorkspacePermissionGroups from './getWorkspacePermissionGroups/handler';
import {PermissionGroupsExportedEndpoints} from './types';
import updatePermissionGroup from './udpatePermissionGroup/handler';

export function getPermissionGroupsPublicHttpEndpoints() {
  const permissionGroupsExportedEndpoints: PermissionGroupsExportedEndpoints = {
    addPermissionGroup: {
      fn: addPermissionGroup,
      mddocHttpDefinition: addPermissionGroupEndpointDefinition,
    },
    assignPermissionGroups: {
      fn: assignPermissionGroups,
      mddocHttpDefinition: assignPermissionGroupsEndpointDefinition,
    },
    deletePermissionGroup: {
      fn: deletePermissionGroup,
      mddocHttpDefinition: deletePermissionGroupEndpointDefinition,
    },
    getPermissionGroup: {
      fn: getPermissionGroup,
      mddocHttpDefinition: getPermissionGroupEndpointDefinition,
    },
    getEntityAssignedPermissionGroups: {
      fn: getEntityAssignedPermissionGroups,
      mddocHttpDefinition: getEntityAssignedPermissionGroupsEndpointDefinition,
    },
    getWorkspacePermissionGroups: {
      fn: getWorkspacePermissionGroups,
      mddocHttpDefinition: getWorkspacePermissionGroupsEndpointDefinition,
    },
    countWorkspacePermissionGroups: {
      fn: countWorkspacePermissionGroups,
      mddocHttpDefinition: countWorkspacePermissionGroupsEndpointDefinition,
    },
    updatePermissionGroup: {
      fn: updatePermissionGroup,
      mddocHttpDefinition: updatePermissionGroupEndpointDefinition,
    },
  };
  return permissionGroupsExportedEndpoints;
}
