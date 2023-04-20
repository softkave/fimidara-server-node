import addWorkspace from './addWorkspace/handler';
import deleteWorkspace from './deleteWorkspace/handler';
import {
  addWorkspaceEndpointDefinition,
  deleteWorkspaceEndpointDefinition,
  getUserWorkspacesEndpointDefinition,
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from './endpoints.mddoc';
import getUserWorkspaces from './getUserWorkspaces/handler';
import getWorkspace from './getWorkspace/handler';
import {WorkspacesExportedEndpoints} from './types';
import updateWorkspace from './updateWorkspace/handler';

export const workspacesExportedEndpoints: WorkspacesExportedEndpoints = {
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
  getWorkspace: {
    fn: getWorkspace,
    mddocHttpDefinition: getWorkspaceEndpointDefinition,
  },
  updateWorkspace: {
    fn: updateWorkspace,
    mddocHttpDefinition: updateWorkspaceEndpointDefinition,
  },
};
