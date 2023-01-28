import {endpointConstants} from '../constants';

export const collabRequestConstants = {
  maxNewRequests: 20,
  routes: {
    sendRequest: `${endpointConstants.apiv1}/collaborationRequests/sendRequest`,
    deleteRequest: `${endpointConstants.apiv1}/collaborationRequests/deleteRequest`,
    getWorkspaceRequests: `${endpointConstants.apiv1}/collaborationRequests/getWorkspaceRequests`,
    getUserRequests: `${endpointConstants.apiv1}/collaborationRequests/getUserRequests`,
    respondToRequest: `${endpointConstants.apiv1}/collaborationRequests/respondToRequest`,
    revokeRequest: `${endpointConstants.apiv1}/collaborationRequests/revokeRequest`,
    updateRequest: `${endpointConstants.apiv1}/collaborationRequests/updateRequest`,
    getRequest: `${endpointConstants.apiv1}/collaborationRequests/getRequest`,
  },
};
