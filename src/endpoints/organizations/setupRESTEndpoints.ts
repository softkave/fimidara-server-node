import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addOrganization from './addOrganization/handler';
import deleteOrganization from './deleteOrganization/handler';
import getOrganization from './getOrganization/handler';
import getRequestOrganization from './getRequestOrganization/handler';
import getUserOrganizations from './getUserOrganizations/handler';
import updateOrganization from './updateOrganization/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupOrganizationsRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addOrganization: wrapEndpointREST(addOrganization, ctx),
    deleteOrganization: wrapEndpointREST(deleteOrganization, ctx),
    getOrganization: wrapEndpointREST(getOrganization, ctx),
    getRequestOrganization: wrapEndpointREST(getRequestOrganization, ctx),
    getUserOrganizations: wrapEndpointREST(getUserOrganizations, ctx),
    updateOrganization: wrapEndpointREST(updateOrganization, ctx),
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
