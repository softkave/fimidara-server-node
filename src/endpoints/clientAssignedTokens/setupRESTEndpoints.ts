import {Connection} from 'mongoose';
import {Express} from 'express';

export default function setupClientAssignedTokenRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {};

  // app.post('/organizations/addOrganization', endpoints.addOrganization);
}
