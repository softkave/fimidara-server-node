import {kEndpointTag} from '../types.js';
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

export function getPermissionGroupsHttpEndpoints() {
  const permissionGroupsExportedEndpoints: PermissionGroupsExportedEndpoints = {
    addPermissionGroup: {
      tag: [kEndpointTag.public],
      fn: addPermissionGroup,
      mddocHttpDefinition: addPermissionGroupEndpointDefinition,
    },
    assignPermissionGroups: {
      tag: [kEndpointTag.public],
      fn: assignPermissionGroups,
      mddocHttpDefinition: assignPermissionGroupsEndpointDefinition,
    },
    unassignPermissionGroups: {
      tag: [kEndpointTag.public],
      fn: unassignPermissionGroups,
      mddocHttpDefinition: unassignPermissionGroupsEndpointDefinition,
    },
    deletePermissionGroup: {
      tag: [kEndpointTag.public],
      fn: deletePermissionGroup,
      mddocHttpDefinition: deletePermissionGroupEndpointDefinition,
    },
    getPermissionGroup: {
      tag: [kEndpointTag.public],
      fn: getPermissionGroup,
      mddocHttpDefinition: getPermissionGroupEndpointDefinition,
    },
    getEntityAssignedPermissionGroups: {
      tag: [kEndpointTag.public],
      fn: getEntityAssignedPermissionGroups,
      mddocHttpDefinition: getEntityAssignedPermissionGroupsEndpointDefinition,
    },
    getWorkspacePermissionGroups: {
      tag: [kEndpointTag.public],
      fn: getWorkspacePermissionGroups,
      mddocHttpDefinition: getWorkspacePermissionGroupsEndpointDefinition,
    },
    countWorkspacePermissionGroups: {
      tag: [kEndpointTag.public],
      fn: countWorkspacePermissionGroups,
      mddocHttpDefinition: countWorkspacePermissionGroupsEndpointDefinition,
    },
    updatePermissionGroup: {
      tag: [kEndpointTag.public],
      fn: updatePermissionGroup,
      mddocHttpDefinition: updatePermissionGroupEndpointDefinition,
    },
  };
  return permissionGroupsExportedEndpoints;
}
