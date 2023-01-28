import {endpointConstants} from '../constants';

export const permissionGroupConstants = {
  maxAssignedPermissionGroups: 100,
  routes: {
    addPermissionGroup: `${endpointConstants.apiv1}/permissionGroups/addPermissionGroup`,
    deletePermissionGroup: `${endpointConstants.apiv1}/permissionGroups/deletePermissionGroup`,
    getWorkspacePermissionGroups: `${endpointConstants.apiv1}/permissionGroups/getWorkspacePermissionGroups`,
    getPermissionGroup: `${endpointConstants.apiv1}/permissionGroups/getPermissionGroup`,
    updatePermissionGroup: `${endpointConstants.apiv1}/permissionGroups/updatePermissionGroup`,
  },
};
