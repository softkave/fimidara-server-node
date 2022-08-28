import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addProgramAccessToken from './addToken/handler';
import deleteProgramAccessToken from './deleteToken/handler';
import getProgramAccessToken from './getToken/handler';
import getWorkspaceProgramAccessTokens from './getWorkspaceTokens/handler';
import updateProgramAccessToken from './updateToken/handler';

export default function setupProgramAccessTokensRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addProgramAccessToken: wrapEndpointREST(addProgramAccessToken, ctx),
    deleteProgramAccessToken: wrapEndpointREST(deleteProgramAccessToken, ctx),
    getWorkspaceProgramAccessTokens: wrapEndpointREST(
      getWorkspaceProgramAccessTokens,
      ctx
    ),
    getProgramAccessToken: wrapEndpointREST(getProgramAccessToken, ctx),
    updateToken: wrapEndpointREST(updateProgramAccessToken, ctx),
  };

  app.post('/programAccessTokens/addToken', endpoints.addProgramAccessToken);
  app.delete(
    '/programAccessTokens/deleteToken',
    endpoints.deleteProgramAccessToken
  );
  app.post(
    '/programAccessTokens/getWorkspaceTokens',
    endpoints.getWorkspaceProgramAccessTokens
  );
  app.post('/programAccessTokens/getToken', endpoints.getProgramAccessToken);
  app.post('/programAccessTokens/updateToken', endpoints.updateToken);
}
