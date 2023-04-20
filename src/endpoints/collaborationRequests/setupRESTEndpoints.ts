import {Express} from 'express';
import {BaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import {collabRequestConstants} from './constants';
import deleteCollaborationRequest from './deleteRequest/handler';
import getUserCollaborationRequest from './getUserRequest/handler';
import getUserRequests from './getUserRequests/handler';
import getWorkspaceCollaborationRequest from './getWorkspaceRequest/handler';
import getWorkspaceRequests from './getWorkspaceRequests/handler';
import respondToRequest from './respondToRequest/handler';
import revokeRequest from './revokeRequest/handler';
import sendRequest from './sendRequest/handler';
import {CollaborationRequestsExportedEndpoints} from './types';
import updateRequest from './updateRequest/handler';

export default function setupCollaborationRequestsRESTEndpoints(ctx: BaseContext, app: Express) {
  const endpoints: CollaborationRequestsExportedEndpoints = {
    sendRequest: wrapEndpointREST(sendRequest, ctx),
    deleteRequest: wrapEndpointREST(deleteCollaborationRequest, ctx),
    getWorkspaceRequests: wrapEndpointREST(getWorkspaceRequests, ctx),
    getUserRequests: wrapEndpointREST(getUserRequests, ctx),
    respondToRequest: wrapEndpointREST(respondToRequest, ctx),
    revokeRequest: wrapEndpointREST(revokeRequest, ctx),
    updateRequest: wrapEndpointREST(updateRequest, ctx),
    getUserRequest: wrapEndpointREST(getUserCollaborationRequest, ctx),
    getWorkspaceRequest: wrapEndpointREST(getWorkspaceCollaborationRequest, ctx),
  };

  app.post(collabRequestConstants.routes.sendRequest, endpoints.sendRequest);
  app.delete(collabRequestConstants.routes.deleteRequest, endpoints.deleteRequest);
  app.post(collabRequestConstants.routes.getWorkspaceRequests, endpoints.getWorkspaceRequests);
  app.post(collabRequestConstants.routes.getUserRequests, endpoints.getUserRequests);
  app.post(collabRequestConstants.routes.respondToRequest, endpoints.respondToRequest);
  app.post(collabRequestConstants.routes.revokeRequest, endpoints.revokeRequest);
  app.post(collabRequestConstants.routes.updateRequest, endpoints.updateRequest);
  app.post(collabRequestConstants.routes.getRequest, endpoints.getRequest);
}
