import {endpointConstants} from '../constants';

export const permissionItemConstants = {
  maxPermissionItemsPerRequest: 1000,
  routes: {
    getEntityPermissionItems: `${endpointConstants.apiv1}/permissionItems/getEntityPermissionItems`,
    addItems: `${endpointConstants.apiv1}/permissionItems/addItems`,
    deleteItemsById: `${endpointConstants.apiv1}/permissionItems/deleteItemsById`,
    deleteItems: `${endpointConstants.apiv1}/permissionItems/deleteItems`,
    getResourcePermissionItems: `${endpointConstants.apiv1}/permissionItems/getResourcePermissionItems`,
    resolveEntityPermissions: `${endpointConstants.apiv1}/permissionItems/resolveEntityPermissions`,
  },
};
