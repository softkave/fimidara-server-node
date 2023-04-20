import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addAgentTokenEndpoint from './addToken/handler';
import {agentTokenConstants} from './constants';
import deleteAgentToken from './deleteToken/handler';
import getAgentToken from './getToken/handler';
import getWorkspaceAgentTokens from './getWorkspaceTokens/handler';
import {AgentTokenExportedEndpoints} from './types';
import updateAgentToken from './updateToken/handler';

export default function setupAgentTokensRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: AgentTokenExportedEndpoints = {
    addToken: wrapEndpointREST(addAgentTokenEndpoint, ctx),
    deleteToken: wrapEndpointREST(deleteAgentToken, ctx),
    getWorkspaceTokens: wrapEndpointREST(getWorkspaceAgentTokens, ctx),
    getToken: wrapEndpointREST(getAgentToken, ctx),
    updateToken: wrapEndpointREST(updateAgentToken, ctx),
  };

  app.post(agentTokenConstants.routes.addToken, endpoints.addToken);
  app.delete(agentTokenConstants.routes.deleteToken, endpoints.deleteToken);
  app.post(agentTokenConstants.routes.getWorkspaceTokens, endpoints.getWorkspaceTokens);
  app.post(agentTokenConstants.routes.getToken, endpoints.getToken);
  app.post(agentTokenConstants.routes.updateToken, endpoints.updateToken);
}
