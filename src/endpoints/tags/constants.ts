import {endpointConstants} from '../constants';

export const tagConstants = {
  maxAssignedTags: 100,
  routes: {
    addTag: `${endpointConstants.apiv1}/tags/addTag`,
    deleteTag: `${endpointConstants.apiv1}/tags/deleteTag`,
    getWorkspaceTags: `${endpointConstants.apiv1}/tags/getWorkspaceTags`,
    getTag: `${endpointConstants.apiv1}/tags/getTag`,
    updateTag: `${endpointConstants.apiv1}/tags/updateTag`,
  },
};
