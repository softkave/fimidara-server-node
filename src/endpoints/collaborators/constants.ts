import {endpointConstants} from '../constants';

export const collaboratorConstants = {
  routes: {
    getCollaborator: `${endpointConstants.apiv1}/collaborators/getCollaborator`,
    getWorkspaceCollaborators: `${endpointConstants.apiv1}/collaborators/getWorkspaceCollaborators`,
    removeCollaborator: `${endpointConstants.apiv1}/collaborators/removeCollaborator`,
  },
};
