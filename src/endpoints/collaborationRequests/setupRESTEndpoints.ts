import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import sendRequest from './sendRequest/handler';
import deleteRequest from './deleteRequest/handler';
import getOrganizationRequests from './getOrganizationRequests/handler';
import getUserRequests from './getUserRequests/handler';
import respondToRequest from './respondToRequest/handler';
import revokeRequest from './revokeRequest/handler';
import updateRequest from './updateRequest/handler';

export default function setupOrganizationRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    sendRequest: wrapEndpointREST(sendRequest, getBaseContext(connection)),
    deleteRequest: wrapEndpointREST(deleteRequest, getBaseContext(connection)),
    getOrganizationRequests: wrapEndpointREST(
      getOrganizationRequests,
      getBaseContext(connection)
    ),
    getUserRequests: wrapEndpointREST(
      getUserRequests,
      getBaseContext(connection)
    ),
    respondToRequest: wrapEndpointREST(
      respondToRequest,
      getBaseContext(connection)
    ),
    revokeRequest: wrapEndpointREST(revokeRequest, getBaseContext(connection)),
    updateRequest: wrapEndpointREST(updateRequest, getBaseContext(connection)),
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
