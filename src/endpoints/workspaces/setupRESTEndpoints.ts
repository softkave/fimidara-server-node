import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addWorkspace from './addWorkspace/handler';
import deleteWorkspace from './deleteWorkspace/handler';
import getRequestWorkspace from './getRequestWorkspace/handler';
import getUserWorkspaces from './getUserWorkspaces/handler';
import getWorkspace from './getWorkspace/handler';
import updateWorkspace from './updateWorkspace/handler';

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
  app.delete('/workspaces/deleteWorkspace', endpoints.deleteWorkspace);
  app.post('/workspaces/getUserWorkspaces', endpoints.getUserWorkspaces);
  app.post('/workspaces/getWorkspace', endpoints.getWorkspace);
  app.post('/workspaces/getRequestWorkspace', endpoints.getRequestWorkspace);
  app.post('/workspaces/updateWorkspace', endpoints.updateWorkspace);
}
