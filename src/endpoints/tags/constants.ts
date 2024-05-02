import {kEndpointConstants} from '../constants.js';

export const tagConstants = {
  maxAssignedTags: 100,
  routes: {
    addTag: `${kEndpointConstants.apiv1}/tags/addTag`,
    deleteTag: `${kEndpointConstants.apiv1}/tags/deleteTag`,
    getWorkspaceTags: `${kEndpointConstants.apiv1}/tags/getWorkspaceTags`,
    countWorkspaceTags: `${kEndpointConstants.apiv1}/tags/countWorkspaceTags`,
    getTag: `${kEndpointConstants.apiv1}/tags/getTag`,
    updateTag: `${kEndpointConstants.apiv1}/tags/updateTag`,
  },
};
