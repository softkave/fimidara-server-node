import addAgentTokenEndpoint from './addToken/handler.js';
import countWorkspaceAgentTokens from './countWorkspaceTokens/handler.js';
import deleteAgentToken from './deleteToken/handler.js';
import {
  addAgentTokenEndpointDefinition,
  countWorkspaceAgentTokensEndpointDefinition,
  deleteAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  getWorkspaceAgentTokensEndpointDefinition,
  updateAgentTokenEndpointDefinition,
} from './endpoints.mddoc.js';
import getAgentToken from './getToken/handler.js';
import getWorkspaceAgentTokens from './getWorkspaceTokens/handler.js';
import {AgentTokensExportedEndpoints} from './types.js';
import updateAgentToken from './updateToken/handler.js';

export function getAgentTokenPublicHttpEndpoints() {
  const agentTokensExportedEndpoints: AgentTokensExportedEndpoints = {
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
    countWorkspaceTokens: {
      fn: countWorkspaceAgentTokens,
      mddocHttpDefinition: countWorkspaceAgentTokensEndpointDefinition,
    },
    updateToken: {
      fn: updateAgentToken,
      mddocHttpDefinition: updateAgentTokenEndpointDefinition,
    },
  };
  return agentTokensExportedEndpoints;
}
