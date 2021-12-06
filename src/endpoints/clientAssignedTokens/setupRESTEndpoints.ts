import {Express} from 'express';
import addClientAssignedToken from './addToken/handler';
import deleteClientAssignedToken from './deleteToken/handler';
import getOrganizationTokens from './getOrganizationTokens/handler';
import getClientAssignedToken from './getToken/handler';
import {wrapEndpointREST} from '../utils';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupClientAssignedTokenRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addToken: wrapEndpointREST(addClientAssignedToken, ctx),
    deleteToken: wrapEndpointREST(deleteClientAssignedToken, ctx),
    getOrganizationTokens: wrapEndpointREST(getOrganizationTokens, ctx),
    getToken: wrapEndpointREST(getClientAssignedToken, ctx),
  };

  app.post('/clientAssignedTokens/addToken', endpoints.addToken);
  app.post('/clientAssignedTokens/deleteToken', endpoints.deleteToken);
  app.post(
    '/clientAssignedTokens/getOrganizationTokens',
    endpoints.getOrganizationTokens
  );
  app.post('/clientAssignedTokens/getToken', endpoints.getToken);
}
