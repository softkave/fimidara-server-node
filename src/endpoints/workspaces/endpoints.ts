import {kEndpointTag} from '../types.js';
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

export function getWorkspacesHttpEndpoints() {
  const workspacesExportedEndpoints: WorkspacesExportedEndpoints = {
    addWorkspace: {
      tag: [kEndpointTag.private],
      fn: addWorkspace,
      mddocHttpDefinition: addWorkspaceEndpointDefinition,
    },
    // deleteWorkspace: {
    //   fn: deleteWorkspace,
    //   mddocHttpDefinition: deleteWorkspaceEndpointDefinition,
    // },
    getUserWorkspaces: {
      tag: [kEndpointTag.private],
      fn: getUserWorkspaces,
      mddocHttpDefinition: getUserWorkspacesEndpointDefinition,
    },
    countUserWorkspaces: {
      tag: [kEndpointTag.private],
      fn: countUserWorkspaces,
      mddocHttpDefinition: countUserWorkspacesEndpointDefinition,
    },
    getWorkspace: {
      tag: [kEndpointTag.public],
      fn: getWorkspace,
      mddocHttpDefinition: getWorkspaceEndpointDefinition,
    },
    updateWorkspace: {
      tag: [kEndpointTag.public],
      fn: updateWorkspace,
      mddocHttpDefinition: updateWorkspaceEndpointDefinition,
    },
  };
  return workspacesExportedEndpoints;
}
