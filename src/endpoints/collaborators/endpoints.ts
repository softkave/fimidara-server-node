import countWorkspaceCollaborators from './countWorkspaceCollaborators/handler';
import {
  countWorkspaceCollaboratorsEndpointDefinition,
  getCollaboratorEndpointDefinition,
  getWorkspaceCollaboratorsEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from './endpoints.mddoc';
import getCollaborator from './getCollaborator/handler';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import {CollaboratorsExportedEndpoints} from './types';

export function getCollaboratorsPublicHttpEndpoints() {
  const collaboratorsExportedEndpoints: CollaboratorsExportedEndpoints = {
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
