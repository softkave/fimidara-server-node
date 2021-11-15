import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addEnvironment from './addBucket/handler';

export default function setupEnvironmentRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addEnvironment: wrapEndpointREST(
      addEnvironment,
      getBaseContext(connection)
    ),
  };

  app.post('/environments/addEnvironment', endpoints.addEnvironment);
}
