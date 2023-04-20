import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addWorkspace from './addWorkspace/handler';
import {workspaceConstants} from './constants';
import deleteWorkspace from './deleteWorkspace/handler';
import getUserWorkspaces from './getUserWorkspaces/handler';
import getWorkspace from './getWorkspace/handler';
import {WorkspacesExportedEndpoints} from './types';
import updateWorkspace from './updateWorkspace/handler';

export default function setupWorkspacesRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: WorkspacesExportedEndpoints = {
    addWorkspace: wrapEndpointREST(addWorkspace, ctx),
    deleteWorkspace: wrapEndpointREST(deleteWorkspace, ctx),
    getWorkspace: wrapEndpointREST(getWorkspace, ctx),
    getUserWorkspaces: wrapEndpointREST(getUserWorkspaces, ctx),
    updateWorkspace: wrapEndpointREST(updateWorkspace, ctx),
  };

  app.post(workspaceConstants.routes.addWorkspace, endpoints.addWorkspace);
  app.delete(workspaceConstants.routes.deleteWorkspace, endpoints.deleteWorkspace);
  app.post(workspaceConstants.routes.getUserWorkspaces, endpoints.getUserWorkspaces);
  app.post(workspaceConstants.routes.getWorkspace, endpoints.getWorkspace);
  app.post(workspaceConstants.routes.updateWorkspace, endpoints.updateWorkspace);
}
