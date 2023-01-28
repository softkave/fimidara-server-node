import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addProgramAccessToken from './addToken/handler';
import {programAccessTokenConstants} from './constants';
import deleteProgramAccessToken from './deleteToken/handler';
import getProgramAccessToken from './getToken/handler';
import getWorkspaceProgramAccessTokens from './getWorkspaceTokens/handler';
import updateProgramAccessToken from './updateToken/handler';

export default function setupProgramAccessTokensRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    addProgramAccessToken: wrapEndpointREST(addProgramAccessToken, ctx),
    deleteProgramAccessToken: wrapEndpointREST(deleteProgramAccessToken, ctx),
    getWorkspaceProgramAccessTokens: wrapEndpointREST(getWorkspaceProgramAccessTokens, ctx),
    getProgramAccessToken: wrapEndpointREST(getProgramAccessToken, ctx),
    updateToken: wrapEndpointREST(updateProgramAccessToken, ctx),
  };

  app.post(programAccessTokenConstants.routes.addToken, endpoints.addProgramAccessToken);
  app.delete(programAccessTokenConstants.routes.deleteToken, endpoints.deleteProgramAccessToken);
  app.post(programAccessTokenConstants.routes.getWorkspaceTokens, endpoints.getWorkspaceProgramAccessTokens);
  app.post(programAccessTokenConstants.routes.getToken, endpoints.getProgramAccessToken);
  app.post(programAccessTokenConstants.routes.updateToken, endpoints.updateToken);
}
