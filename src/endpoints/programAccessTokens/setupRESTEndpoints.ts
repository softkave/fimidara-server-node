import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addProgramAccessToken from './addToken/handler';
import deleteProgramAccessToken from './deleteToken/handler';
import getOrganizationProgramAccessTokens from './getOrganizationTokens/handler';
import getProgramAccessToken from './getToken/handler';
import {IBaseContext} from '../contexts/BaseContext';
import updateProgramAccessTokenPresets from './updatePresets/handler';

export default function setupProgramAccessTokensRESTEndpoints(
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
    updatePresets: wrapEndpointREST(updateProgramAccessTokenPresets, ctx),
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
  app.post('/programAccessTokens/updatePresets', endpoints.updatePresets);
}
