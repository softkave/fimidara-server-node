import {kEndpointTag} from '../types.js';
import countWorkspaceCollaborators from './countWorkspaceCollaborators/handler.js';
import {
  countWorkspaceCollaboratorsEndpointDefinition,
  getCollaboratorEndpointDefinition,
  getCollaboratorsWithoutPermissionEndpointDefinition,
  getWorkspaceCollaboratorsEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from './endpoints.mddoc.js';
import getCollaborator from './getCollaborator/handler.js';
import getCollaboratorsWithoutPermission from './getCollaboratorsWithoutPermission/handler.js';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler.js';
import removeCollaborator from './removeCollaborator/handler.js';
import {CollaboratorsExportedEndpoints} from './types.js';

export function getCollaboratorsHttpEndpoints() {
  const collaboratorsExportedEndpoints: CollaboratorsExportedEndpoints = {
    getCollaborator: {
      tag: [kEndpointTag.public],
      fn: getCollaborator,
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
      fn: removeCollaborator,
      mddocHttpDefinition: removeCollaboratorEndpointDefinition,
    },
    getCollaboratorsWithoutPermission: {
      tag: [kEndpointTag.private],
      fn: getCollaboratorsWithoutPermission,
      mddocHttpDefinition: getCollaboratorsWithoutPermissionEndpointDefinition,
    },
  };

  return collaboratorsExportedEndpoints;
}
