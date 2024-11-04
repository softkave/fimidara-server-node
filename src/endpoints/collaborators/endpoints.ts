import {kEndpointTag} from '../types.js';
import countWorkspaceCollaborators from './countCollaborators/handler.js';
import {
  countWorkspaceCollaboratorsEndpointDefinition,
  getCollaboratorEndpointDefinition,
  getCollaboratorsWithoutPermissionEndpointDefinition,
  getWorkspaceCollaboratorsEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from './endpoints.mddoc.js';
import getCollaboratorEndpoint from './getCollaborator/handler.js';
import getWorkspaceCollaborators from './getCollaborators/handler.js';
import getCollaboratorsWithoutPermissionEndpoint from './getCollaboratorsWithoutPermission/handler.js';
import removeCollaboratorEndpoint from './removeCollaborator/handler.js';
import {CollaboratorsExportedEndpoints} from './types.js';

export function getCollaboratorsHttpEndpoints() {
  const collaboratorsExportedEndpoints: CollaboratorsExportedEndpoints = {
    getCollaborator: {
      tag: [kEndpointTag.public],
      fn: getCollaboratorEndpoint,
      mddocHttpDefinition: getCollaboratorEndpointDefinition,
    },
    getWorkspaceCollaborators: {
      tag: [kEndpointTag.public],
      fn: getWorkspaceCollaborators,
      mddocHttpDefinition: getWorkspaceCollaboratorsEndpointDefinition,
    },
    countWorkspaceCollaborators: {
      tag: [kEndpointTag.public],
      fn: countWorkspaceCollaborators,
      mddocHttpDefinition: countWorkspaceCollaboratorsEndpointDefinition,
    },
    removeCollaborator: {
      tag: [kEndpointTag.public],
      fn: removeCollaboratorEndpoint,
      mddocHttpDefinition: removeCollaboratorEndpointDefinition,
    },
    getCollaboratorsWithoutPermission: {
      tag: [kEndpointTag.private],
      fn: getCollaboratorsWithoutPermissionEndpoint,
      mddocHttpDefinition: getCollaboratorsWithoutPermissionEndpointDefinition,
    },
  };

  return collaboratorsExportedEndpoints;
}
