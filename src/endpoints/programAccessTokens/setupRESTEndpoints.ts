import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addProgramAccessToken from './addToken/handler';
import deleteProgramAccessToken from './deleteToken/handler';
import getOrganizationProgramAccessTokens from './getOrganizationTokens/handler';
import getProgramAccessToken from './getToken/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupOrganizationRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addProgramAccessToken: wrapEndpointREST(addProgramAccessToken, ctx),
    deleteProgramAccessToken: wrapEndpointREST(deleteProgramAccessToken, ctx),
    getOrganizationProgramAccessTokens: wrapEndpointREST(
      getOrganizationProgramAccessTokens,
      ctx
    ),
    getProgramAccessToken: wrapEndpointREST(getProgramAccessToken, ctx),
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
