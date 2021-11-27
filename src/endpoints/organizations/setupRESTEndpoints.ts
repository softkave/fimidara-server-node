import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addOrganization from './addOrganization/handler';
import deleteOrganization from './deleteOrganization/handler';
import getOrganization from './getOrganization/handler';
import getRequestOrganization from './getRequestOrganization/handler';
import getUserOrganizations from './getUserOrganizations/handler';
import updateOrganization from './updateOrganization/handler';

export default function setupOrganizationRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addOrganization: wrapEndpointREST(
      addOrganization,
      getBaseContext(connection)
    ),
    deleteOrganization: wrapEndpointREST(
      deleteOrganization,
      getBaseContext(connection)
    ),
    getOrganization: wrapEndpointREST(
      getOrganization,
      getBaseContext(connection)
    ),
    getRequestOrganization: wrapEndpointREST(
      getRequestOrganization,
      getBaseContext(connection)
    ),
    getUserOrganizations: wrapEndpointREST(
      getUserOrganizations,
      getBaseContext(connection)
    ),
    updateOrganization: wrapEndpointREST(
      updateOrganization,
      getBaseContext(connection)
    ),
  };

  app.post('/organizations/addOrganization', endpoints.addOrganization);
  app.post('/organizations/deleteOrganization', endpoints.deleteOrganization);
  app.post(
    '/organizations/getUserOrganizations',
    endpoints.getUserOrganizations
  );
  app.post('/organizations/getOrganization', endpoints.getOrganization);
  app.post(
    '/organizations/getRequestOrganization',
    endpoints.getRequestOrganization
  );
  app.post('/organizations/updateOrganization', endpoints.updateOrganization);
}
