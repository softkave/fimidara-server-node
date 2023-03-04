import {endpointConstants} from '../constants';

export const agentTokenConstants = {
  routes: {
    addToken: `${endpointConstants.apiv1}/agentTokens/addToken`,
    deleteToken: `${endpointConstants.apiv1}/agentTokens/deleteToken`,
    getWorkspaceTokens: `${endpointConstants.apiv1}/agentTokens/getWorkspaceTokens`,
    getToken: `${endpointConstants.apiv1}/agentTokens/getToken`,
    updateToken: `${endpointConstants.apiv1}/agentTokens/updateToken`,
  },
};
