import {endpointConstants} from '../constants';

export const permissionItemConstants = {
  maxPermissionItemsPerRequest: 1000,
  routes: {
    addItems: `${endpointConstants.apiv1}/permissionItems/addItems`,
    deleteItems: `${endpointConstants.apiv1}/permissionItems/deleteItems`,
    resolveEntityPermissions: `${endpointConstants.apiv1}/permissionItems/resolveEntityPermissions`,
  },
};
