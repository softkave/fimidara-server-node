import {Connection} from 'mongoose';
import {Express} from 'express';
import addClientAssignedToken from './addToken/handler';
import deleteClientAssignedToken from './deleteToken/handler';
import getOrganizationTokens from './getOrganizationTokens/handler';
import getClientAssignedToken from './getToken/handler';
import {wrapEndpointREST} from '../utils';
import {getBaseContext} from '../contexts/BaseContext';

export default function setupClientAssignedTokenRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addToken: wrapEndpointREST(
      addClientAssignedToken,
      getBaseContext(connection)
    ),
    deleteToken: wrapEndpointREST(
      deleteClientAssignedToken,
      getBaseContext(connection)
    ),
    getOrganizationTokens: wrapEndpointREST(
      getOrganizationTokens,
      getBaseContext(connection)
    ),
    getToken: wrapEndpointREST(
      getClientAssignedToken,
      getBaseContext(connection)
    ),
  };

  app.post('/clientAssignedTokens/addToken', endpoints.addToken);
  app.post('/clientAssignedTokens/deleteToken', endpoints.deleteToken);
  app.post(
    '/clientAssignedTokens/getOrganizationTokens',
    endpoints.getOrganizationTokens
  );
  app.post('/clientAssignedTokens/getToken', endpoints.getToken);
}
