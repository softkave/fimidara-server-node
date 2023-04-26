import {endpointConstants} from '../constants';

export const workspaceConstants = {
  routes: {
    addWorkspace: `${endpointConstants.apiv1}/workspaces/addWorkspace`,
    deleteWorkspace: `${endpointConstants.apiv1}/workspaces/deleteWorkspace`,
    getUserWorkspaces: `${endpointConstants.apiv1}/workspaces/getUserWorkspaces`,
    countUserWorkspaces: `${endpointConstants.apiv1}/workspaces/countUserWorkspaces`,
    getWorkspace: `${endpointConstants.apiv1}/workspaces/getWorkspace`,
    updateWorkspace: `${endpointConstants.apiv1}/workspaces/updateWorkspace`,
  },
};
