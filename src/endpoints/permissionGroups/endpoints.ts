import addPermissionGroup from './addPermissionGroup/handler.js';
import assignPermissionGroups from './assignPermissionGroups/handler.js';
import countWorkspacePermissionGroups from './countWorkspacePermissionGroups/handler.js';
import deletePermissionGroup from './deletePermissionGroup/handler.js';
import {
  addPermissionGroupEndpointDefinition,
  assignPermissionGroupsEndpointDefinition,
  countWorkspacePermissionGroupsEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  getEntityAssignedPermissionGroupsEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  unassignPermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from './endpoints.mddoc.js';
import getEntityAssignedPermissionGroups from './getEntityAssignedPermissionGroups/handler.js';
import getPermissionGroup from './getPermissionGroup/handler.js';
import getWorkspacePermissionGroups from './getWorkspacePermissionGroups/handler.js';
import {PermissionGroupsExportedEndpoints} from './types.js';
import updatePermissionGroup from './udpatePermissionGroup/handler.js';
import unassignPermissionGroups from './unassignPermissionGroups/handler.js';

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
    unassignPermissionGroups: {
      fn: unassignPermissionGroups,
      mddocHttpDefinition: unassignPermissionGroupsEndpointDefinition,
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
