import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import deleteRequest from './deleteRequest/handler';
import getRequest from './getRequest/handler';
import getUserRequests from './getUserRequests/handler';
import getWorkspaceRequests from './getWorkspaceRequests/handler';
import respondToRequest from './respondToRequest/handler';
import revokeRequest from './revokeRequest/handler';
import sendRequest from './sendRequest/handler';
import updateRequest from './updateRequest/handler';

export default function setupCollaborationRequestsRESTEndpoints(ctx: IBaseContext, app: Express) {
  const endpoints = {
    sendRequest: wrapEndpointREST(sendRequest, ctx),
    deleteRequest: wrapEndpointREST(deleteRequest, ctx),
    getWorkspaceRequests: wrapEndpointREST(getWorkspaceRequests, ctx),
    getUserRequests: wrapEndpointREST(getUserRequests, ctx),
    respondToRequest: wrapEndpointREST(respondToRequest, ctx),
    revokeRequest: wrapEndpointREST(revokeRequest, ctx),
    updateRequest: wrapEndpointREST(updateRequest, ctx),
    getRequest: wrapEndpointREST(getRequest, ctx),
  };

  app.post('/collaborationRequests/sendRequest', endpoints.sendRequest);
  app.delete('/collaborationRequests/deleteRequest', endpoints.deleteRequest);
  app.post('/collaborationRequests/getWorkspaceRequests', endpoints.getWorkspaceRequests);
  app.post('/collaborationRequests/getUserRequests', endpoints.getUserRequests);
  app.post('/collaborationRequests/respondToRequest', endpoints.respondToRequest);
  app.post('/collaborationRequests/revokeRequest', endpoints.revokeRequest);
  app.post('/collaborationRequests/updateRequest', endpoints.updateRequest);
  app.post('/collaborationRequests/getRequest', endpoints.getRequest);
}
