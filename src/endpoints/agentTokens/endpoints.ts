import {kEndpointTag} from '../types.js';
import addAgentTokenEndpoint from './addToken/handler.js';
import countWorkspaceAgentTokens from './countTokens/handler.js';
import deleteAgentTokenEndpoint from './deleteToken/handler.js';
import encodeAgentTokenEndpoint from './encodeToken/handler.js';
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
import getAgentTokenEndpoint from './getToken/handler.js';
import getWorkspaceAgentTokens from './getTokens/handler.js';
import refreshAgentTokenEndpoint from './refreshToken/handler.js';
import {AgentTokensExportedEndpoints} from './types.js';
import updateAgentTokenEndpoint from './updateToken/handler.js';

export function getAgentTokenHttpEndpoints() {
  const agentTokensExportedEndpoints: AgentTokensExportedEndpoints = {
    addToken: {
      tag: [kEndpointTag.public],
      fn: addAgentTokenEndpoint,
      mddocHttpDefinition: addAgentTokenEndpointDefinition,
    },
    deleteToken: {
      tag: [kEndpointTag.public],
      fn: deleteAgentTokenEndpoint,
      mddocHttpDefinition: deleteAgentTokenEndpointDefinition,
    },
    getToken: {
      tag: [kEndpointTag.public],
      fn: getAgentTokenEndpoint,
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
      fn: updateAgentTokenEndpoint,
      mddocHttpDefinition: updateAgentTokenEndpointDefinition,
    },
    refreshToken: {
      tag: [kEndpointTag.public],
      fn: refreshAgentTokenEndpoint,
      mddocHttpDefinition: refreshAgentTokenEndpointDefinition,
    },
    encodeToken: {
      tag: [kEndpointTag.public],
      fn: encodeAgentTokenEndpoint,
      mddocHttpDefinition: encodeAgentTokenEndpointDefinition,
    },
  };
  return agentTokensExportedEndpoints;
}
