import countWorkspaceCollaborators from './countWorkspaceCollaborators/handler';
import {
  countWorkspaceCollaboratorsEndpointDefinition,
  getCollaboratorEndpointDefinition,
  getCollaboratorsWithoutPermissionEndpointDefinition,
  getWorkspaceCollaboratorsEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from './endpoints.mddoc';
import getCollaborator from './getCollaborator/handler';
import getCollaboratorsWithoutPermission from './getCollaboratorsWithoutPermission/handler';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import {CollaboratorsPrivateExportedEndpoints, CollaboratorsPublicExportedEndpoints} from './types';

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
