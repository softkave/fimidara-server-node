import {
  getCollaboratorEndpointDefinition,
  getWorkspaceCollaboratorsEndpointDefinition,
  removeCollaboratorEndpointDefinition,
} from './endpoints.mddoc';
import getCollaborator from './getCollaborator/handler';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import {CollaboratorsExportedEndpoints} from './types';

export const collaboratorsExportedEndpoints: CollaboratorsExportedEndpoints = {
  getCollaborator: {
    fn: getCollaborator,
    mddocHttpDefinition: getCollaboratorEndpointDefinition,
  },
  getWorkspaceCollaborators: {
    fn: getWorkspaceCollaborators,
    mddocHttpDefinition: getWorkspaceCollaboratorsEndpointDefinition,
  },
  removeCollaborator: {
    fn: removeCollaborator,
    mddocHttpDefinition: removeCollaboratorEndpointDefinition,
  },
};
