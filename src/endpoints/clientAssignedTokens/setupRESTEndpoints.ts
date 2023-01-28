import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addClientAssignedToken from './addToken/handler';
import {clientAssignedTokenConstants} from './constants';
import deleteClientAssignedToken from './deleteToken/handler';
import getClientAssignedToken from './getToken/handler';
import getWorkspaceClientAssignedTokens from './getWorkspaceTokens/handler';
import updateClientAssignedToken from './updateToken/handler';

export default function setupClientAssignedTokensRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addToken: wrapEndpointREST(addClientAssignedToken, ctx),
    deleteToken: wrapEndpointREST(deleteClientAssignedToken, ctx),
    getWorkspaceTokens: wrapEndpointREST(getWorkspaceClientAssignedTokens, ctx),
    getToken: wrapEndpointREST(getClientAssignedToken, ctx),
    updateToken: wrapEndpointREST(updateClientAssignedToken, ctx),
  };

  app.post(clientAssignedTokenConstants.routes.addToken, endpoints.addToken);
  app.delete(clientAssignedTokenConstants.routes.deleteToken, endpoints.deleteToken);
  app.post(clientAssignedTokenConstants.routes.getWorkspaceTokens, endpoints.getWorkspaceTokens);
  app.post(clientAssignedTokenConstants.routes.getToken, endpoints.getToken);
  app.post(clientAssignedTokenConstants.routes.updateToken, endpoints.updateToken);
}
