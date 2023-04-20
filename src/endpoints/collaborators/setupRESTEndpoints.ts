import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import {collaboratorConstants} from './constants';
import getCollaborator from './getCollaborator/handler';
import getWorkspaceCollaborators from './getWorkspaceCollaborators/handler';
import removeCollaborator from './removeCollaborator/handler';
import {CollaboratorsExportedEndpoints} from './types';

export default function setupCollaboratorsRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: CollaboratorsExportedEndpoints = {
    getCollaborator: wrapEndpointREST(getCollaborator, ctx),
    getWorkspaceCollaborators: wrapEndpointREST(getWorkspaceCollaborators, ctx),
    removeCollaborator: wrapEndpointREST(removeCollaborator, ctx),
  };

  app.post(collaboratorConstants.routes.getCollaborator, endpoints.getCollaborator);
  app.post(
    collaboratorConstants.routes.getWorkspaceCollaborators,
    endpoints.getWorkspaceCollaborators
  );
  app.post(collaboratorConstants.routes.removeCollaborator, endpoints.removeCollaborator);
}
