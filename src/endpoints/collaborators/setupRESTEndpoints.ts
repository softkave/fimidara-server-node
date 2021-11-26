import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import getCollaborator from './getCollaborator/handler';
import getOrganizationCollaborators from './getOrganizationCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import updateCollaboratorPresets from './updateCollaboratorPresets/handler';

export default function setupOrganizationRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    getCollaborator: wrapEndpointREST(
      getCollaborator,
      getBaseContext(connection)
    ),
    getOrganizationCollaborators: wrapEndpointREST(
      getOrganizationCollaborators,
      getBaseContext(connection)
    ),
    removeCollaborator: wrapEndpointREST(
      removeCollaborator,
      getBaseContext(connection)
    ),
    updateCollaboratorPresets: wrapEndpointREST(
      updateCollaboratorPresets,
      getBaseContext(connection)
    ),
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
