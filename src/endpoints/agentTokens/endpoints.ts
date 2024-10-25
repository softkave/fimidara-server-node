import {kEndpointTag} from '../types.js';
import addAgentTokenEndpoint from './addToken/handler.js';
import countWorkspaceAgentTokens from './countWorkspaceTokens/handler.js';
import deleteAgentToken from './deleteToken/handler.js';
import encodeAgentToken from './encodeToken/handler.js';
import {
  addAgentTokenEndpointDefinition,
  countWorkspaceAgentTokensEndpointDefinition,
  deleteAgentTokenEndpointDefinition,
  encodeAgentTokenEndpointDefinition,
  getAgentTokenEndpointDefinition,
  getWorkspaceAgentTokensEndpointDefinition,
  refreshAgentTokenEndpointDefinition,
  updateAgentTokenEndpointDefinition,
} from './endpoints.mddoc.js';
import getAgentToken from './getToken/handler.js';
import getWorkspaceAgentTokens from './getWorkspaceTokens/handler.js';
import refreshAgentToken from './refreshToken/handler.js';
import {AgentTokensExportedEndpoints} from './types.js';
import updateAgentToken from './updateToken/handler.js';

export function getAgentTokenHttpEndpoints() {
  const agentTokensExportedEndpoints: AgentTokensExportedEndpoints = {
    addToken: {
      tag: [kEndpointTag.public],
      fn: addAgentTokenEndpoint,
      mddocHttpDefinition: addAgentTokenEndpointDefinition,
    },
    deleteToken: {
      tag: [kEndpointTag.public],
      fn: deleteAgentToken,
      mddocHttpDefinition: deleteAgentTokenEndpointDefinition,
    },
    getToken: {
      tag: [kEndpointTag.public],
      fn: getAgentToken,
      mddocHttpDefinition: getAgentTokenEndpointDefinition,
    },
    getWorkspaceTokens: {
      tag: [kEndpointTag.public],
      fn: getWorkspaceAgentTokens,
      mddocHttpDefinition: getWorkspaceAgentTokensEndpointDefinition,
    },
    countWorkspaceTokens: {
      tag: [kEndpointTag.public],
      fn: countWorkspaceAgentTokens,
      mddocHttpDefinition: countWorkspaceAgentTokensEndpointDefinition,
    },
    updateToken: {
      tag: [kEndpointTag.public],
      fn: updateAgentToken,
      mddocHttpDefinition: updateAgentTokenEndpointDefinition,
    },
    refreshToken: {
      tag: [kEndpointTag.public],
      fn: refreshAgentToken,
      mddocHttpDefinition: refreshAgentTokenEndpointDefinition,
    },
    encodeToken: {
      tag: [kEndpointTag.public],
      fn: encodeAgentToken,
      mddocHttpDefinition: encodeAgentTokenEndpointDefinition,
    },
  };
  return agentTokensExportedEndpoints;
}
