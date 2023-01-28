import {endpointConstants} from '../constants';

export const programAccessTokenConstants = {
  tokenSecretKeyLength: 48,
  routes: {
    addToken: `${endpointConstants.apiv1}/programAccessTokens/addToken`,
    deleteToken: `${endpointConstants.apiv1}/programAccessTokens/deleteToken`,
    getWorkspaceTokens: `${endpointConstants.apiv1}/programAccessTokens/getWorkspaceTokens`,
    getToken: `${endpointConstants.apiv1}/programAccessTokens/getToken`,
    updateToken: `${endpointConstants.apiv1}/programAccessTokens/updateToken`,
  },
};
