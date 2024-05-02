import {kEndpointConstants} from '../constants.js';

export const workspaceConstants = {
  routes: {
    addWorkspace: `${kEndpointConstants.apiv1}/workspaces/addWorkspace`,
    deleteWorkspace: `${kEndpointConstants.apiv1}/workspaces/deleteWorkspace`,
    getUserWorkspaces: `${kEndpointConstants.apiv1}/workspaces/getUserWorkspaces`,
    countUserWorkspaces: `${kEndpointConstants.apiv1}/workspaces/countUserWorkspaces`,
    getWorkspace: `${kEndpointConstants.apiv1}/workspaces/getWorkspace`,
    updateWorkspace: `${kEndpointConstants.apiv1}/workspaces/updateWorkspace`,
  },
};
