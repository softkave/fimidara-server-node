import {kEndpointConstants} from '../constants.js';

export const collabRequestConstants = {
  maxNewRequests: 20,
  routes: {
    sendRequest: `${kEndpointConstants.apiv1}/collaborationRequests/sendRequest`,
    deleteRequest: `${kEndpointConstants.apiv1}/collaborationRequests/deleteRequest`,
    getWorkspaceRequests: `${kEndpointConstants.apiv1}/collaborationRequests/getWorkspaceRequests`,
    getUserRequests: `${kEndpointConstants.apiv1}/collaborationRequests/getUserRequests`,
    countWorkspaceRequests: `${kEndpointConstants.apiv1}/collaborationRequests/countWorkspaceRequests`,
    countUserRequests: `${kEndpointConstants.apiv1}/collaborationRequests/countUserRequests`,
    respondToRequest: `${kEndpointConstants.apiv1}/collaborationRequests/respondToRequest`,
    revokeRequest: `${kEndpointConstants.apiv1}/collaborationRequests/revokeRequest`,
    updateRequest: `${kEndpointConstants.apiv1}/collaborationRequests/updateRequest`,
    getUserRequest: `${kEndpointConstants.apiv1}/collaborationRequests/getUserRequest`,
    getWorkspaceRequest: `${kEndpointConstants.apiv1}/collaborationRequests/getWorkspaceRequest`,
  },
};
