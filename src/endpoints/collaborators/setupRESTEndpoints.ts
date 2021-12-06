import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import getCollaborator from './getCollaborator/handler';
import getOrganizationCollaborators from './getOrganizationCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import updateCollaboratorPresets from './updateCollaboratorPresets/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupOrganizationRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    getCollaborator: wrapEndpointREST(getCollaborator, ctx),
    getOrganizationCollaborators: wrapEndpointREST(
      getOrganizationCollaborators,
      ctx
    ),
    removeCollaborator: wrapEndpointREST(removeCollaborator, ctx),
    updateCollaboratorPresets: wrapEndpointREST(updateCollaboratorPresets, ctx),
  };

  app.post('/collaborators/getCollaborator', endpoints.getCollaborator);
  app.post(
    '/collaborators/getOrganizationCollaborators',
    endpoints.getOrganizationCollaborators
  );
  app.post('/collaborators/removeCollaborator', endpoints.removeCollaborator);
  app.post(
    '/collaborators/updateCollaboratorPresets',
    endpoints.updateCollaboratorPresets
  );
}
