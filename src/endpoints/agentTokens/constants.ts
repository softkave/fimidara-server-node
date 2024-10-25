import {kEndpointConstants} from '../constants.js';

export const kAgentTokenConstants = {
  routes: {
    addToken: `${kEndpointConstants.apiv1}/agentTokens/addToken`,
    deleteToken: `${kEndpointConstants.apiv1}/agentTokens/deleteToken`,
    getWorkspaceTokens: `${kEndpointConstants.apiv1}/agentTokens/getWorkspaceTokens`,
    countWorkspaceTokens: `${kEndpointConstants.apiv1}/agentTokens/countWorkspaceTokens`,
    getToken: `${kEndpointConstants.apiv1}/agentTokens/getToken`,
    updateToken: `${kEndpointConstants.apiv1}/agentTokens/updateToken`,
    refreshToken: `${kEndpointConstants.apiv1}/agentTokens/refreshToken`,
    encodeToken: `${kEndpointConstants.apiv1}/agentTokens/encodeToken`,
  },
  refreshDurationMs: 1000 * 60 * 60 * 24 * 30, // 30 days
};
