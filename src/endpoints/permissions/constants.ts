import {kEndpointConstants} from '../constants.js';

export const permissionItemConstants = {
  maxPermissionItemsPerRequest: 1000,
  maxAssignedPermissionGroups: 100,
  routes: {
    addPermissionItems: `${kEndpointConstants.apiv1}/permissions/addPermissionItems`,
    deletePermissionItems: `${kEndpointConstants.apiv1}/permissions/deletePermissionItems`,
    resolvePermissions: `${kEndpointConstants.apiv1}/permissions/resolvePermissions`,
    addPermissionGroup: `${kEndpointConstants.apiv1}/permissions/addPermissionGroup`,
    deletePermissionGroup: `${kEndpointConstants.apiv1}/permissions/deletePermissionGroup`,
    getPermissionGroups: `${kEndpointConstants.apiv1}/permissions/getPermissionGroups`,
    countPermissionGroups: `${kEndpointConstants.apiv1}/permissions/countPermissionGroups`,
    assignPermissionGroups: `${kEndpointConstants.apiv1}/permissions/assignPermissionGroups`,
    unassignPermissionGroups: `${kEndpointConstants.apiv1}/permissions/unassignPermissionGroups`,
    getAssignedPermissionGroups: `${kEndpointConstants.apiv1}/permissions/getAssignedPermissionGroups`,
    getPermissionGroup: `${kEndpointConstants.apiv1}/permissions/getPermissionGroup`,
    updatePermissionGroup: `${kEndpointConstants.apiv1}/permissions/updatePermissionGroup`,
  },
};
