import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import getCollaborator from './getCollaborator/handler';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import updateCollaboratorPresets from './updateCollaboratorPresets/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupCollaboratorsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    getCollaborator: wrapEndpointREST(getCollaborator, ctx),
    getWorkspaceCollaborators: wrapEndpointREST(getWorkspaceCollaborators, ctx),
    removeCollaborator: wrapEndpointREST(removeCollaborator, ctx),
    updateCollaboratorPresets: wrapEndpointREST(updateCollaboratorPresets, ctx),
  };

  app.post('/collaborators/getCollaborator', endpoints.getCollaborator);
  app.post(
    '/collaborators/getWorkspaceCollaborators',
    endpoints.getWorkspaceCollaborators
  );
  app.post('/collaborators/removeCollaborator', endpoints.removeCollaborator);
  app.post(
    '/collaborators/updateCollaboratorPresets',
    endpoints.updateCollaboratorPresets
  );
}
