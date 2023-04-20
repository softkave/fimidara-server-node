import addAgentTokenEndpoint from './addToken/handler';
import deleteAgentToken from './deleteToken/handler';
import {
  addAgentTokenEndpointDefinition,
  deleteAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  getWorkspaceAgentTokensEndpointDefinition,
  updateAgentTokenEndpointDefinition,
} from './endpoints.mddoc';
import getAgentToken from './getToken/handler';
import getWorkspaceAgentTokens from './getWorkspaceTokens/handler';
import {AgentTokensExportedEndpoints} from './types';
import updateAgentToken from './updateToken/handler';

export const agentTokensExportedEndpoints: AgentTokensExportedEndpoints = {
  addToken: {
    fn: addAgentTokenEndpoint,
    mddocHttpDefinition: addAgentTokenEndpointDefinition,
  },
  deleteToken: {
    fn: deleteAgentToken,
    mddocHttpDefinition: deleteAgentTokenEndpointDefinition,
  },
  getToken: {
    fn: getAgentToken,
    mddocHttpDefinition: getAgentTokenEndpointDefinition,
  },
  getWorkspaceTokens: {
    fn: getWorkspaceAgentTokens,
    mddocHttpDefinition: getWorkspaceAgentTokensEndpointDefinition,
  },
  updateToken: {
    fn: updateAgentToken,
    mddocHttpDefinition: updateAgentTokenEndpointDefinition,
  },
};
