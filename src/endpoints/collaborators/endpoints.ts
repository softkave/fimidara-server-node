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
import {CollaboratorsPrivateExportedEndpoints, CollaboratorsPublicExportedEndpoints} from './types.js';

export function getCollaboratorsPublicHttpEndpoints() {
  const collaboratorsExportedEndpoints: CollaboratorsPublicExportedEndpoints = {
    getCollaborator: {
      fn: getCollaborator,
      mddocHttpDefinition: getCollaboratorEndpointDefinition,
    },
    getWorkspaceCollaborators: {
      fn: getWorkspaceCollaborators,
      mddocHttpDefinition: getWorkspaceCollaboratorsEndpointDefinition,
    },
    countWorkspaceCollaborators: {
      fn: countWorkspaceCollaborators,
      mddocHttpDefinition: countWorkspaceCollaboratorsEndpointDefinition,
    },
    removeCollaborator: {
      fn: removeCollaborator,
      mddocHttpDefinition: removeCollaboratorEndpointDefinition,
    },
  };
  return collaboratorsExportedEndpoints;
}

export function getCollaboratorsPrivateHttpEndpoints() {
  const collaboratorsExportedEndpoints: CollaboratorsPrivateExportedEndpoints = {
    getCollaboratorsWithoutPermission: {
      fn: getCollaboratorsWithoutPermission,
      mddocHttpDefinition: getCollaboratorsWithoutPermissionEndpointDefinition,
    },
  };
  return collaboratorsExportedEndpoints;
}
