import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import sendRequests from './sendRequests/handler';

export default function setupOrganizationRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addOrganization: wrapEndpointREST(sendRequests, getBaseContext(connection)),
  };

  app.post('/organizations/addOrganization', endpoints.addOrganization);
}
