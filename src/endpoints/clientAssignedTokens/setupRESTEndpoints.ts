import {Express} from 'express';
import addClientAssignedToken from './addToken/handler';
import deleteClientAssignedToken from './deleteToken/handler';
import getWorkspaceClientAssignedTokens from './getWorkspaceTokens/handler';
import getClientAssignedToken from './getToken/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';
import updateClientAssignedToken from './updateToken/handler';

export default function setupClientAssignedTokensRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addToken: wrapEndpointREST(addClientAssignedToken, ctx),
    deleteToken: wrapEndpointREST(deleteClientAssignedToken, ctx),
    getWorkspaceTokens: wrapEndpointREST(getWorkspaceClientAssignedTokens, ctx),
    getToken: wrapEndpointREST(getClientAssignedToken, ctx),
    updateToken: wrapEndpointREST(updateClientAssignedToken, ctx),
  };

  app.post('/clientAssignedTokens/addToken', endpoints.addToken);
  app.delete('/clientAssignedTokens/deleteToken', endpoints.deleteToken);
  app.post(
    '/clientAssignedTokens/getWorkspaceTokens',
    endpoints.getWorkspaceTokens
  );
  app.post('/clientAssignedTokens/getToken', endpoints.getToken);
  app.post('/clientAssignedTokens/updateToken', endpoints.updateToken);
}
