import {kEndpointConstants} from '../constants.js';

export const collaboratorConstants = {
  routes: {
    getCollaborator: `${kEndpointConstants.apiv1}/collaborators/getCollaborator`,
    getWorkspaceCollaborators: `${kEndpointConstants.apiv1}/collaborators/getWorkspaceCollaborators`,
    countWorkspaceCollaborators: `${kEndpointConstants.apiv1}/collaborators/countWorkspaceCollaborators`,
    removeCollaborator: `${kEndpointConstants.apiv1}/collaborators/removeCollaborator`,
    getCollaboratorsWithoutPermission: `${kEndpointConstants.apiv1}/collaborators/getCollaboratorsWithoutPermission`,
  },
};
