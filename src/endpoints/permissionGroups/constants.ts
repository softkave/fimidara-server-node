import {kEndpointConstants} from '../constants.js';

export const permissionGroupConstants = {
  maxAssignedPermissionGroups: 100,
  routes: {
    addPermissionGroup: `${kEndpointConstants.apiv1}/permissionGroups/addPermissionGroup`,
    deletePermissionGroup: `${kEndpointConstants.apiv1}/permissionGroups/deletePermissionGroup`,
    getWorkspacePermissionGroups: `${kEndpointConstants.apiv1}/permissionGroups/getWorkspacePermissionGroups`,
    countWorkspacePermissionGroups: `${kEndpointConstants.apiv1}/permissionGroups/countWorkspacePermissionGroups`,
    assignPermissionGroups: `${kEndpointConstants.apiv1}/permissionGroups/assignPermissionGroups`,
    unassignPermissionGroups: `${kEndpointConstants.apiv1}/permissionGroups/unassignPermissionGroups`,
    getEntityAssignedPermissionGroups: `${kEndpointConstants.apiv1}/permissionGroups/getEntityAssignedPermissionGroups`,
    getPermissionGroup: `${kEndpointConstants.apiv1}/permissionGroups/getPermissionGroup`,
    updatePermissionGroup: `${kEndpointConstants.apiv1}/permissionGroups/updatePermissionGroup`,
  },
};
