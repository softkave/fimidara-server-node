import {kEndpointConstants} from '../constants.js';

export const workspaceConstants = {
  routes: {
    addWorkspace: `${kEndpointConstants.apiv1}/workspaces/addWorkspace`,
    deleteWorkspace: `${kEndpointConstants.apiv1}/workspaces/deleteWorkspace`,
    getWorkspaces: `${kEndpointConstants.apiv1}/workspaces/getWorkspaces`,
    countWorkspaces: `${kEndpointConstants.apiv1}/workspaces/countWorkspaces`,
    getWorkspace: `${kEndpointConstants.apiv1}/workspaces/getWorkspace`,
    updateWorkspace: `${kEndpointConstants.apiv1}/workspaces/updateWorkspace`,
  },
};
