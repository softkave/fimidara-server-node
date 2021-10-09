import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addFolder from './addFolder/handler';

export default function setupFolderRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addFolder: wrapEndpointREST(addFolder, getBaseContext(connection)),
  };

  app.post('/folders/addFolder', endpoints.addFolder);
}
