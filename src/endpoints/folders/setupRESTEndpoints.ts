import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import addFolder from './addFolder/handler';
import deleteFolder from './deleteFolder/handler';
import getFolder from './getFolder/handler';
import listFolderContent from './listFolderContent/handler';
import updateFolder from './updateFolder/handler';

export default function setupFolderRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    addFolder: wrapEndpointREST(addFolder, getBaseContext(connection)),
    deleteFolder: wrapEndpointREST(deleteFolder, getBaseContext(connection)),
    getFolder: wrapEndpointREST(getFolder, getBaseContext(connection)),
    listFolderContent: wrapEndpointREST(
      listFolderContent,
      getBaseContext(connection)
    ),
    updateFolder: wrapEndpointREST(updateFolder, getBaseContext(connection)),
  };

  app.post('/folders/addFolder', endpoints.addFolder);
  app.post('/folders/deleteFolder', endpoints.deleteFolder);
  app.post('/folders/getFolder', endpoints.getFolder);
  app.post('/folders/listFolderContent', endpoints.listFolderContent);
  app.post('/folders/updateFolder', endpoints.updateFolder);
}
