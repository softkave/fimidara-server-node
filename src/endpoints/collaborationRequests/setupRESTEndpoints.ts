import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import sendRequest from './sendRequest/handler';
import deleteRequest from './deleteRequest/handler';
import getOrganizationRequests from './getOrganizationRequests/handler';
import getUserRequests from './getUserRequests/handler';
import respondToRequest from './respondToRequest/handler';
import revokeRequest from './revokeRequest/handler';
import updateRequest from './updateRequest/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupCollaborationRequestsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    sendRequest: wrapEndpointREST(sendRequest, ctx),
    deleteRequest: wrapEndpointREST(deleteRequest, ctx),
    getOrganizationRequests: wrapEndpointREST(getOrganizationRequests, ctx),
    getUserRequests: wrapEndpointREST(getUserRequests, ctx),
    respondToRequest: wrapEndpointREST(respondToRequest, ctx),
    revokeRequest: wrapEndpointREST(revokeRequest, ctx),
    updateRequest: wrapEndpointREST(updateRequest, ctx),
  };

  app.post('/requests/sendRequest', endpoints.sendRequest);
  app.post('/requests/deleteRequest', endpoints.deleteRequest);
  app.post(
    '/requests/getOrganizationRequests',
    endpoints.getOrganizationRequests
  );
  app.post('/requests/getUserRequests', endpoints.getUserRequests);
  app.post('/requests/respondToRequest', endpoints.respondToRequest);
  app.post('/requests/revokeRequest', endpoints.revokeRequest);
  app.post('/requests/updateRequest', endpoints.updateRequest);
}
