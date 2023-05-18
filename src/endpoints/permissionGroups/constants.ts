import {endpointConstants} from '../constants';

export const permissionGroupConstants = {
  maxAssignedPermissionGroups: 100,
  routes: {
    addPermissionGroup: `${endpointConstants.apiv1}/permissionGroups/addPermissionGroup`,
    deletePermissionGroup: `${endpointConstants.apiv1}/permissionGroups/deletePermissionGroup`,
    getWorkspacePermissionGroups: `${endpointConstants.apiv1}/permissionGroups/getWorkspacePermissionGroups`,
    countWorkspacePermissionGroups: `${endpointConstants.apiv1}/permissionGroups/countWorkspacePermissionGroups`,
    assignPermissionGroups: `${endpointConstants.apiv1}/permissionGroups/assignPermissionGroups`,
    unassignPermissionGroups: `${endpointConstants.apiv1}/permissionGroups/unassignPermissionGroups`,
    getEntityAssignedPermissionGroups: `${endpointConstants.apiv1}/permissionGroups/getEntityAssignedPermissionGroups`,
    getPermissionGroup: `${endpointConstants.apiv1}/permissionGroups/getPermissionGroup`,
    updatePermissionGroup: `${endpointConstants.apiv1}/permissionGroups/updatePermissionGroup`,
  },
};
