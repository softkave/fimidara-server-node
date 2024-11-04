import {kEndpointTag} from '../types.js';
import addPermissionGroupEndpoint from './addPermissionGroup/handler.js';
import addPermissionItemsEndpoint from './addPermissionItems/handler.js';
import assignPermissionGroupsEndpoint from './assignPermissionGroups/handler.js';
import countWorkspacePermissionGroups from './countPermissionGroups/handler.js';
import deletePermissionGroupEndpoint from './deletePermissionGroup/handler.js';
import deletePermissionItemsEndpoint from './deletePermissionItems/handler.js';
import {
  addPermissionGroupEndpointDefinition,
  addPermissionItemsEndpointDefinition,
  assignPermissionGroupsEndpointDefinition,
  countWorkspacePermissionGroupsEndpointDefinition,
  deletePermissionGroupEndpointDefinition,
  deletePermissionItemsEndpointDefinition,
  getEntityAssignedPermissionGroupsEndpointDefinition,
  getPermissionGroupEndpointDefinition,
  getWorkspacePermissionGroupsEndpointDefinition,
  resolveEntityPermissionsEndpointDefinition,
  unassignPermissionGroupsEndpointDefinition,
  updatePermissionGroupEndpointDefinition,
} from './endpoints.mddoc.js';
import getEntityAssignedPermissionGroups from './getAssignedPermissionGroups/handler.js';
import getPermissionGroupEndpoint from './getPermissionGroup/handler.js';
import getWorkspacePermissionGroups from './getPermissionGroups/handler.js';
import resolveEntityPermissions from './resolvePermissions/handler.js';
import {PermissionItemsExportedEndpoints} from './types.js';
import unassignPermissionGroupsEndpoint from './unassignPermissionGroups/handler.js';
import updatePermissionGroupEndpoint from './updatePermissionGroup/handler.js';

export function getPermissionItemsHttpEndpoints() {
  const permissionItemsExportedEndpoints: PermissionItemsExportedEndpoints = {
    addItems: {
      tag: [kEndpointTag.public],
      fn: addPermissionItemsEndpoint,
      mddocHttpDefinition: addPermissionItemsEndpointDefinition,
    },
    deleteItems: {
      tag: [kEndpointTag.public],
      fn: deletePermissionItemsEndpoint,
      mddocHttpDefinition: deletePermissionItemsEndpointDefinition,
    },
    resolveEntityPermissions: {
      tag: [kEndpointTag.public],
      fn: resolveEntityPermissions,
      mddocHttpDefinition: resolveEntityPermissionsEndpointDefinition,
    },
    addPermissionGroup: {
      tag: [kEndpointTag.public],
      fn: addPermissionGroupEndpoint,
      mddocHttpDefinition: addPermissionGroupEndpointDefinition,
    },
    assignPermissionGroups: {
      tag: [kEndpointTag.public],
      fn: assignPermissionGroupsEndpoint,
      mddocHttpDefinition: assignPermissionGroupsEndpointDefinition,
    },
    unassignPermissionGroups: {
      tag: [kEndpointTag.public],
      fn: unassignPermissionGroupsEndpoint,
      mddocHttpDefinition: unassignPermissionGroupsEndpointDefinition,
    },
    deletePermissionGroup: {
      tag: [kEndpointTag.public],
      fn: deletePermissionGroupEndpoint,
      mddocHttpDefinition: deletePermissionGroupEndpointDefinition,
    },
    getPermissionGroup: {
      tag: [kEndpointTag.public],
      fn: getPermissionGroupEndpoint,
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
      fn: updatePermissionGroupEndpoint,
      mddocHttpDefinition: updatePermissionGroupEndpointDefinition,
    },
  };
  return permissionItemsExportedEndpoints;
}
