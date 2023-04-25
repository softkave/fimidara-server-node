import addWorkspace from './addWorkspace/handler';
import countUserWorkspaces from './countUserWorkspaces/handler';
import deleteWorkspace from './deleteWorkspace/handler';
import {
  addWorkspaceEndpointDefinition,
  countUserWorkspacesEndpointDefinition,
  deleteWorkspaceEndpointDefinition,
  getUserWorkspacesEndpointDefinition,
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from './endpoints.mddoc';
import getUserWorkspaces from './getUserWorkspaces/handler';
import getWorkspace from './getWorkspace/handler';
import {WorkspacesExportedEndpoints} from './types';
import updateWorkspace from './updateWorkspace/handler';

export function getWorkspacesPublicHttpEndpoints() {
  const workspacesExportedEndpoints: WorkspacesExportedEndpoints = {
    addWorkspace: {
      fn: addWorkspace,
      mddocHttpDefinition: addWorkspaceEndpointDefinition,
    },
    deleteWorkspace: {
      fn: deleteWorkspace,
      mddocHttpDefinition: deleteWorkspaceEndpointDefinition,
    },
    getUserWorkspaces: {
      fn: getUserWorkspaces,
      mddocHttpDefinition: getUserWorkspacesEndpointDefinition,
    },
    countUserWorkspaces: {
      fn: countUserWorkspaces,
      mddocHttpDefinition: countUserWorkspacesEndpointDefinition,
    },
    getWorkspace: {
      fn: getWorkspace,
      mddocHttpDefinition: getWorkspaceEndpointDefinition,
    },
    updateWorkspace: {
      fn: updateWorkspace,
      mddocHttpDefinition: updateWorkspaceEndpointDefinition,
    },
  };
  return workspacesExportedEndpoints;
}
