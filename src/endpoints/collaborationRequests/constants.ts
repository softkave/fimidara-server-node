import {endpointConstants} from '../constants';

export const collabRequestConstants = {
  maxNewRequests: 20,
  routes: {
    sendRequest: `${endpointConstants.apiv1}/collaborationRequests/sendRequest`,
    deleteRequest: `${endpointConstants.apiv1}/collaborationRequests/deleteRequest`,
    getWorkspaceRequests: `${endpointConstants.apiv1}/collaborationRequests/getWorkspaceRequests`,
    getUserRequests: `${endpointConstants.apiv1}/collaborationRequests/getUserRequests`,
    countWorkspaceRequests: `${endpointConstants.apiv1}/collaborationRequests/countWorkspaceRequests`,
    countUserRequests: `${endpointConstants.apiv1}/collaborationRequests/countUserRequests`,
    respondToRequest: `${endpointConstants.apiv1}/collaborationRequests/respondToRequest`,
    revokeRequest: `${endpointConstants.apiv1}/collaborationRequests/revokeRequest`,
    updateRequest: `${endpointConstants.apiv1}/collaborationRequests/updateRequest`,
    getUserRequest: `${endpointConstants.apiv1}/collaborationRequests/getUserRequest`,
    getWorkspaceRequest: `${endpointConstants.apiv1}/collaborationRequests/getWorkspaceRequest`,
  },
};
