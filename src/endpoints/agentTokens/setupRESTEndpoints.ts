import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addAgentToken from './addToken/handler';
import {agentTokenConstants} from './constants';
import deleteAgentToken from './deleteToken/handler';
import getAgentToken from './getToken/handler';
import getWorkspaceAgentTokens from './getWorkspaceTokens/handler';
import updateAgentToken from './updateToken/handler';

export default function setupAgentTokensRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addAgentToken: wrapEndpointREST(addAgentToken, ctx),
    deleteAgentToken: wrapEndpointREST(deleteAgentToken, ctx),
    getWorkspaceAgentTokens: wrapEndpointREST(getWorkspaceAgentTokens, ctx),
    getAgentToken: wrapEndpointREST(getAgentToken, ctx),
    updateToken: wrapEndpointREST(updateAgentToken, ctx),
  };

  app.post(agentTokenConstants.routes.addToken, endpoints.addAgentToken);
  app.delete(agentTokenConstants.routes.deleteToken, endpoints.deleteAgentToken);
  app.post(agentTokenConstants.routes.getWorkspaceTokens, endpoints.getWorkspaceAgentTokens);
  app.post(agentTokenConstants.routes.getToken, endpoints.getAgentToken);
  app.post(agentTokenConstants.routes.updateToken, endpoints.updateToken);
}
