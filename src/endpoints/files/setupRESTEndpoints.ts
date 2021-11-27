import {Connection} from 'mongoose';
import {getBaseContext} from '../contexts/BaseContext';
import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import deleteFile from './deleteFile/handler';
import getFile from './getFile/handler';
import getFileDetails from './getFileDetails/handler';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';

export default function setupOrganizationRESTEndpoints(
  connection: Connection,
  app: Express
) {
  const endpoints = {
    deleteFile: wrapEndpointREST(deleteFile, getBaseContext(connection)),

    // TODO: send file
    // TODO: look into using Content-Disposition header
    getFile: wrapEndpointREST(getFile, getBaseContext(connection)),
    getFileDetails: wrapEndpointREST(
      getFileDetails,
      getBaseContext(connection)
    ),
    updateFileDetails: wrapEndpointREST(
      updateFileDetails,
      getBaseContext(connection)
    ),
    uploadFile: wrapEndpointREST(uploadFile, getBaseContext(connection)),
  };

  app.post('/files/deleteFile', endpoints.deleteFile);
  app.post('/files/getFile', endpoints.getFile);
  app.post('/files/getFileDetails', endpoints.getFileDetails);
  app.post('/files/updateFileDetails', endpoints.updateFileDetails);
  app.post('/files/uploadFile', endpoints.uploadFile);
}
