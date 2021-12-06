import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import deleteFile from './deleteFile/handler';
import getFile from './getFile/handler';
import getFileDetails from './getFileDetails/handler';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupOrganizationRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    deleteFile: wrapEndpointREST(deleteFile, ctx),

    // TODO: send file
    // TODO: look into using Content-Disposition header
    getFile: wrapEndpointREST(getFile, ctx),
    getFileDetails: wrapEndpointREST(getFileDetails, ctx),
    updateFileDetails: wrapEndpointREST(updateFileDetails, ctx),
    uploadFile: wrapEndpointREST(uploadFile, ctx),
  };

  app.post('/files/deleteFile', endpoints.deleteFile);
  app.post('/files/getFile', endpoints.getFile);
  app.post('/files/getFileDetails', endpoints.getFileDetails);
  app.post('/files/updateFileDetails', endpoints.updateFileDetails);
  app.post('/files/uploadFile', endpoints.uploadFile);
}
