import {kEndpointConstants} from '../constants.js';

export const agentTokenConstants = {
  routes: {
    addToken: `${kEndpointConstants.apiv1}/agentTokens/addToken`,
    deleteToken: `${kEndpointConstants.apiv1}/agentTokens/deleteToken`,
    getWorkspaceTokens: `${kEndpointConstants.apiv1}/agentTokens/getWorkspaceTokens`,
    countWorkspaceTokens: `${kEndpointConstants.apiv1}/agentTokens/countWorkspaceTokens`,
    getToken: `${kEndpointConstants.apiv1}/agentTokens/getToken`,
    updateToken: `${kEndpointConstants.apiv1}/agentTokens/updateToken`,
  },
};
