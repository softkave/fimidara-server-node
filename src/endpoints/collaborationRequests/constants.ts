import {kEndpointConstants} from '../constants.js';

export const collabRequestConstants = {
  maxNewRequests: 20,
  routes: {
    sendRequest: `${kEndpointConstants.apiv1}/collaborationRequests/sendRequest`,
    deleteRequest: `${kEndpointConstants.apiv1}/collaborationRequests/deleteRequest`,
    getRequests: `${kEndpointConstants.apiv1}/collaborationRequests/getRequests`,
    getUserRequests: `${kEndpointConstants.apiv1}/collaborationRequests/getUserRequests`,
    countRequests: `${kEndpointConstants.apiv1}/collaborationRequests/countRequests`,
    countUserRequests: `${kEndpointConstants.apiv1}/collaborationRequests/countUserRequests`,
    respondToRequest: `${kEndpointConstants.apiv1}/collaborationRequests/respondToRequest`,
    revokeRequest: `${kEndpointConstants.apiv1}/collaborationRequests/revokeRequest`,
    updateRequest: `${kEndpointConstants.apiv1}/collaborationRequests/updateRequest`,
    getUserRequest: `${kEndpointConstants.apiv1}/collaborationRequests/getUserRequest`,
    getRequest: `${kEndpointConstants.apiv1}/collaborationRequests/getRequest`,
  },
};
