import addPermissionItems from './addItems/handler.js';
import deletePermissionItems from './deleteItems/handler.js';
import {
  addPermissionItemsEndpointDefinition,
  deletePermissionItemsEndpointDefinition,
  resolveEntityPermissionsEndpointDefinition,
} from './endpoints.mddoc.js';
import resolveEntityPermissions from './resolveEntityPermissions/handler.js';
import {PermissionItemsExportedEndpoints} from './types.js';

export function getPermissionItemsPublicHttpEndpoints() {
  const permissionItemsExportedEndpoints: PermissionItemsExportedEndpoints = {
    addItems: {
      fn: addPermissionItems,
      mddocHttpDefinition: addPermissionItemsEndpointDefinition,
    },
    deleteItems: {
      fn: deletePermissionItems,
      mddocHttpDefinition: deletePermissionItemsEndpointDefinition,
    },
    resolveEntityPermissions: {
      fn: resolveEntityPermissions,
      mddocHttpDefinition: resolveEntityPermissionsEndpointDefinition,
    },
  };
  return permissionItemsExportedEndpoints;
}
