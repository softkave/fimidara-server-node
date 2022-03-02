import {Response, Request, Express} from 'express';
import * as multer from 'multer';
import {wrapEndpointREST} from '../utils';
import deleteFile from './deleteFile/handler';
import getFile from './getFile/handler';
import getFileDetails from './getFileDetails/handler';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {IBaseContext} from '../contexts/BaseContext';
import {fileConstants} from './constants';
import {GetFileEndpoint, IGetFileEndpointParams} from './getFile/types';
import {isNumber} from 'lodash';

function handleGetFileResponse(
  res: Response,
  result: Awaited<ReturnType<GetFileEndpoint>>
) {
  res
    .set({
      'Content-Length': result.buffer.length,
      'Content-Type': result.file.mimetype,
    })
    .status(200)
    .send(result.buffer);
}

// '/files/getFile/:imagePath'
function getGetFileData(req: Request): IGetFileEndpointParams {
  const organizationId = req.query.orgId as string;
  const filePath = req.query.p as string;
  const width = req.query.w;
  const height = req.query.h;
  return {
    organizationId,
    path: filePath,
    imageTranformation:
      isNumber(width) && isNumber(height) ? {width, height} : undefined,
  };
}

export default function setupFilesRESTEndpoints(
  ctx: IBaseContext,
  app: Express,
  upload: multer.Multer
) {
  const endpoints = {
    deleteFile: wrapEndpointREST(deleteFile, ctx),
    getFileDetails: wrapEndpointREST(getFileDetails, ctx),
    updateFileDetails: wrapEndpointREST(updateFileDetails, ctx),
    uploadFile: wrapEndpointREST(uploadFile, ctx),
  };

  // TODO: look into using Content-Disposition header
  // TODO: look into using ETags
  app.post(
    '/files/getFile',
    wrapEndpointREST(getFile, ctx, handleGetFileResponse)
  );

  app.get(
    '/files/getFile/:imagePath',
    wrapEndpointREST(getFile, ctx, handleGetFileResponse, getGetFileData)
  );

  app.post('/files/deleteFile', endpoints.deleteFile);
  app.post('/files/getFileDetails', endpoints.getFileDetails);
  app.post('/files/updateFileDetails', endpoints.updateFileDetails);
  app.post(
    '/files/uploadFile',
    upload.single(fileConstants.uploadedFileFieldName),
    endpoints.uploadFile
  );
}
