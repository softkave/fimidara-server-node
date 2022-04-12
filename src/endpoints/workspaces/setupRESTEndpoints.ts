import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addWorkspace from './addWorkspace/handler';
import deleteWorkspace from './deleteWorkspace/handler';
import getWorkspace from './getWorkspace/handler';
import getRequestWorkspace from './getRequestWorkspace/handler';
import getUserWorkspaces from './getUserWorkspaces/handler';
import updateWorkspace from './updateWorkspace/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupWorkspacesRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addWorkspace: wrapEndpointREST(addWorkspace, ctx),
    deleteWorkspace: wrapEndpointREST(deleteWorkspace, ctx),
    getWorkspace: wrapEndpointREST(getWorkspace, ctx),
    getRequestWorkspace: wrapEndpointREST(getRequestWorkspace, ctx),
    getUserWorkspaces: wrapEndpointREST(getUserWorkspaces, ctx),
    updateWorkspace: wrapEndpointREST(updateWorkspace, ctx),
  };

  app.post('/workspaces/addWorkspace', endpoints.addWorkspace);
  app.post('/workspaces/deleteWorkspace', endpoints.deleteWorkspace);
  app.post('/workspaces/getUserWorkspaces', endpoints.getUserWorkspaces);
  app.post('/workspaces/getWorkspace', endpoints.getWorkspace);
  app.post('/workspaces/getRequestWorkspace', endpoints.getRequestWorkspace);
  app.post('/workspaces/updateWorkspace', endpoints.updateWorkspace);
}
