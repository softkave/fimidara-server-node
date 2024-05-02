import addWorkspace from './addWorkspace/handler.js';
import countUserWorkspaces from './countUserWorkspaces/handler.js';
import {
  addWorkspaceEndpointDefinition,
  countUserWorkspacesEndpointDefinition,
  getUserWorkspacesEndpointDefinition,
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from './endpoints.mddoc.js';
import getUserWorkspaces from './getUserWorkspaces/handler.js';
import getWorkspace from './getWorkspace/handler.js';
import {WorkspacesExportedEndpoints} from './types.js';
import updateWorkspace from './updateWorkspace/handler.js';

export function getWorkspacesPublicHttpEndpoints() {
  const workspacesExportedEndpoints: WorkspacesExportedEndpoints = {
    addWorkspace: {
      fn: addWorkspace,
      mddocHttpDefinition: addWorkspaceEndpointDefinition,
    },
    // deleteWorkspace: {
    //   fn: deleteWorkspace,
    //   mddocHttpDefinition: deleteWorkspaceEndpointDefinition,
    // },
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
