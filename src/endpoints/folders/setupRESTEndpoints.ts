import {Express} from 'express';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import addFolder from './addFolder/handler';
import deleteFolder from './deleteFolder/handler';
import getFolder from './getFolder/handler';
import listFolderContent from './listFolderContent/handler';
import updateFolder from './updateFolder/handler';

export default function setupFoldersRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    addFolder: wrapEndpointREST(addFolder, ctx),
    deleteFolder: wrapEndpointREST(deleteFolder, ctx),
    getFolder: wrapEndpointREST(getFolder, ctx),
    listFolderContent: wrapEndpointREST(listFolderContent, ctx),
    updateFolder: wrapEndpointREST(updateFolder, ctx),
  };

  app.post('/folders/addFolder', endpoints.addFolder);
  app.delete('/folders/deleteFolder', endpoints.deleteFolder);
  app.post('/folders/getFolder', endpoints.getFolder);
  app.post('/folders/listFolderContent', endpoints.listFolderContent);
  app.post('/folders/updateFolder', endpoints.updateFolder);
}
