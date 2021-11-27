import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addProgramAccessToken from './addToken/handler';
import deleteProgramAccessToken from './deleteToken/handler';
import getOrganizationProgramAccessTokens from './getOrganizationTokens/handler';
import getProgramAccessToken from './getToken/handler';

export default function setupOrganizationRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addProgramAccessToken: wrapEndpointREST(
      addProgramAccessToken,
      getBaseContext(connection)
    ),
    deleteProgramAccessToken: wrapEndpointREST(
      deleteProgramAccessToken,
      getBaseContext(connection)
    ),
    getOrganizationProgramAccessTokens: wrapEndpointREST(
      getOrganizationProgramAccessTokens,
      getBaseContext(connection)
    ),
    getProgramAccessToken: wrapEndpointREST(
      getProgramAccessToken,
      getBaseContext(connection)
    ),
  };

  app.post('/programAccessTokens/addToken', endpoints.addProgramAccessToken);
  app.post(
    '/programAccessTokens/deleteToken',
    endpoints.deleteProgramAccessToken
  );
  app.post(
    '/programAccessTokens/getOrganizationTokens',
    endpoints.getOrganizationProgramAccessTokens
  );
  app.post('/programAccessTokens/getToken', endpoints.getProgramAccessToken);
}
