import {endpointConstants} from '../constants';

export const permissionItemConstants = {
  maxPermissionItemsSavedPerRequest: 1000,
  routes: {
    replaceItemsByEntity: `${endpointConstants.apiv1}/permissionItems/replaceItemsByEntity`,
    getEntityPermissionItems: `${endpointConstants.apiv1}/permissionItems/getEntityPermissionItems`,
    addItems: `${endpointConstants.apiv1}/permissionItems/addItems`,
    deleteItemsById: `${endpointConstants.apiv1}/permissionItems/deleteItemsById`,
    getResourcePermissionItems: `${endpointConstants.apiv1}/permissionItems/getResourcePermissionItems`,
  },
};
