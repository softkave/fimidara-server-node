import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import getCollaborator from './getCollaborator/handler';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import updateCollaboratorPermissionGroups from './updateCollaboratorPermissionGroups/handler';

export default function setupCollaboratorsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    getCollaborator: wrapEndpointREST(getCollaborator, ctx),
    getWorkspaceCollaborators: wrapEndpointREST(getWorkspaceCollaborators, ctx),
    removeCollaborator: wrapEndpointREST(removeCollaborator, ctx),
    updateCollaboratorPermissionGroups: wrapEndpointREST(updateCollaboratorPermissionGroups, ctx),
  };

  app.post('/collaborators/getCollaborator', endpoints.getCollaborator);
  app.post('/collaborators/getWorkspaceCollaborators', endpoints.getWorkspaceCollaborators);
  app.post('/collaborators/removeCollaborator', endpoints.removeCollaborator);
  app.post('/collaborators/updateCollaboratorPermissionGroups', endpoints.updateCollaboratorPermissionGroups);
}
