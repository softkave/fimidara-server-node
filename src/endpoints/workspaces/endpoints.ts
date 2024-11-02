import {kEndpointTag} from '../types.js';
import addWorkspaceEndpoint from './addWorkspace/handler.js';
import countWorkspacesEndpoint from './countWorkspaces/handler.js';
import {
  addWorkspaceEndpointDefinition,
  countWorkspacesEndpointDefinition,
  getWorkspaceEndpointDefinition,
  getWorkspacesEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from './endpoints.mddoc.js';
import getWorkspaceEndpoint from './getWorkspace/handler.js';
import getWorkspacesEndpoint from './getWorkspaces/handler.js';
import {WorkspacesExportedEndpoints} from './types.js';
import updateWorkspaceEndpoint from './updateWorkspace/handler.js';

export function getWorkspacesHttpEndpoints() {
  const workspacesExportedEndpoints: WorkspacesExportedEndpoints = {
    addWorkspace: {
      tag: [kEndpointTag.private],
      fn: addWorkspaceEndpoint,
      mddocHttpDefinition: addWorkspaceEndpointDefinition,
    },
    // deleteWorkspace: {
    //   fn: deleteWorkspace,
    //   mddocHttpDefinition: deleteWorkspaceEndpointDefinition,
    // },
    getWorkspaces: {
      tag: [kEndpointTag.private],
      fn: getWorkspacesEndpoint,
      mddocHttpDefinition: getWorkspacesEndpointDefinition,
    },
    countWorkspaces: {
      tag: [kEndpointTag.private],
      fn: countWorkspacesEndpoint,
      mddocHttpDefinition: countWorkspacesEndpointDefinition,
    },
    getWorkspace: {
      tag: [kEndpointTag.public],
      fn: getWorkspaceEndpoint,
      mddocHttpDefinition: getWorkspaceEndpointDefinition,
    },
    updateWorkspace: {
      tag: [kEndpointTag.public],
      fn: updateWorkspaceEndpoint,
      mddocHttpDefinition: updateWorkspaceEndpointDefinition,
    },
  };
  return workspacesExportedEndpoints;
}
