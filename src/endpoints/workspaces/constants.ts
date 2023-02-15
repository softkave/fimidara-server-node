import {endpointConstants} from '../constants';

export const workspaceConstants = {
  routes: {
    addWorkspace: `${endpointConstants.apiv1}/workspaces/addWorkspace`,
    deleteWorkspace: `${endpointConstants.apiv1}/workspaces/deleteWorkspace`,
    getUserWorkspaces: `${endpointConstants.apiv1}/workspaces/getUserWorkspaces`,
    getWorkspace: `${endpointConstants.apiv1}/workspaces/getWorkspace`,
    updateWorkspace: `${endpointConstants.apiv1}/workspaces/updateWorkspace`,
  },
};
