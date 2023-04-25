import addPermissionItems from './addItems/handler';
import deletePermissionItems from './deleteItems/handler';
import {
  addPermissionItemsEndpointDefinition,
  deletePermissionItemsEndpointDefinition,
} from './endpoints.mddoc';
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
  };
  return permissionItemsExportedEndpoints;
}
