import addPermissionItems from './addItems/handler';
import deletePermissionItems from './deleteItems/handler';
import {
  addPermissionItemsEndpointDefinition,
  deletePermissionItemsEndpointDefinition,
  resolveEntityPermissionsEndpointDefinition,
} from './endpoints.mddoc';
import resolveEntityPermissions from './resolveEntityPermissions/handler';
import {PermissionItemsExportedEndpoints} from './types';

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
