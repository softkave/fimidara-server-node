import {endpointConstants} from '../constants';

export const collaboratorConstants = {
  routes: {
    getCollaborator: `${endpointConstants.apiv1}/collaborators/getCollaborator`,
    getWorkspaceCollaborators: `${endpointConstants.apiv1}/collaborators/getWorkspaceCollaborators`,
    countWorkspaceCollaborators: `${endpointConstants.apiv1}/collaborators/countWorkspaceCollaborators`,
    removeCollaborator: `${endpointConstants.apiv1}/collaborators/removeCollaborator`,
    getCollaboratorsWithoutPermission: `${endpointConstants.apiv1}/collaborators/getCollaboratorsWithoutPermission`,
  },
};
