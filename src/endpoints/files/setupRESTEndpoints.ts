import {wrapEndpointREST} from '../utils';
import {Express} from 'express';
import deleteFile from './deleteFile/handler';
import getFile from './getFile/handler';
import getFileDetails from './getFileDetails/handler';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {IBaseContext} from '../contexts/BaseContext';

export default function setupFilesRESTEndpoints(
  ctx: IBaseContext,
  app: Express
) {
  const endpoints = {
    deleteFile: wrapEndpointREST(deleteFile, ctx),

    // TODO: look into using Content-Disposition header
    // TODO: look into using ETags
    getFile: wrapEndpointREST(getFile, ctx, (res, result) => {
      res
        .set({
          'Content-Length': result.buffer.length,
          'Content-Type': result.file.mimetype,
        })
        .status(200)
        .send(result.buffer);
    }),

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
