import {kEndpointConstants} from '../constants.js';

export const collaboratorConstants = {
  routes: {
    getCollaborator: `${kEndpointConstants.apiv1}/collaborators/getCollaborator`,
    getCollaborators: `${kEndpointConstants.apiv1}/collaborators/getCollaborators`,
    countCollaborators: `${kEndpointConstants.apiv1}/collaborators/countCollaborators`,
    removeCollaborator: `${kEndpointConstants.apiv1}/collaborators/removeCollaborator`,
    getCollaboratorsWithoutPermission: `${kEndpointConstants.apiv1}/collaborators/getCollaboratorsWithoutPermission`,
  },
};
