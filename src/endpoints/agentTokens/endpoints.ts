import addAgentTokenEndpoint from './addToken/handler';
import countWorkspaceAgentTokens from './countWorkspaceTokens/handler';
import deleteAgentToken from './deleteToken/handler';
import {
  addAgentTokenEndpointDefinition,
  countWorkspaceAgentTokensEndpointDefinition,
  deleteAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  getWorkspaceAgentTokensEndpointDefinition,
  updateAgentTokenEndpointDefinition,
} from './endpoints.mddoc';
import getAgentToken from './getToken/handler';
import getWorkspaceAgentTokens from './getWorkspaceTokens/handler';
import {AgentTokensExportedEndpoints} from './types';
import updateAgentToken from './updateToken/handler';

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
