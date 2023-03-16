import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import {collabRequestConstants} from './constants';
import deleteRequest from './deleteRequest/handler';
import getRequest from './getUserRequest/handler';
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

  app.post(collabRequestConstants.routes.sendRequest, endpoints.sendRequest);
  app.delete(collabRequestConstants.routes.deleteRequest, endpoints.deleteRequest);
  app.post(collabRequestConstants.routes.getWorkspaceRequests, endpoints.getWorkspaceRequests);
  app.post(collabRequestConstants.routes.getUserRequests, endpoints.getUserRequests);
  app.post(collabRequestConstants.routes.respondToRequest, endpoints.respondToRequest);
  app.post(collabRequestConstants.routes.revokeRequest, endpoints.revokeRequest);
  app.post(collabRequestConstants.routes.updateRequest, endpoints.updateRequest);
  app.post(collabRequestConstants.routes.getRequest, endpoints.getRequest);
}
