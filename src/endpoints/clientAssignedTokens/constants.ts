import {endpointConstants} from '../constants';

export const clientAssignedTokenConstants = {
  routes: {
    addToken: `${endpointConstants.apiv1}/clientAssignedTokens/addToken`,
    deleteToken: `${endpointConstants.apiv1}/clientAssignedTokens/deleteToken`,
    getWorkspaceTokens: `${endpointConstants.apiv1}/clientAssignedTokens/getWorkspaceTokens`,
    getToken: `${endpointConstants.apiv1}/clientAssignedTokens/getToken`,
    updateToken: `${endpointConstants.apiv1}/clientAssignedTokens/updateToken`,
  },
};
