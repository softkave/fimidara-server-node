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
import {isNumber, merge} from 'lodash';
import {IUploadFileParams} from './uploadFile/types';

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

function extractGetFileParamsFromReq(req: Request): IGetFileEndpointParams {
  const organizationId = req.query.orgId as string;
  const filePath = req.query.p as string;
  const width = req.query.w;
  const height = req.query.h;
  return {
    organizationId,
    path: filePath,
    imageTranformation:
      isNumber(width) && isNumber(height) ? {width, height} : undefined,
    ...req.body,
  };
}

function extractUploadFilesParamsFromQuery(
  req: Request
): Partial<IUploadFileParams> {
  const organizationId = req.query.orgId as string;
  const filePath = req.query.p as string;
  return {
    organizationId,
    path: filePath,
  };
}

function extractUploadFilesParamsFromFormData(req: Request): IUploadFileParams {
  const file = req.file;
  return {
    ...req.body,
    data: file?.buffer,
    mimetype: req.body.mimetype || file?.mimetype,
  };
}

function extractUploadFilesParamsFromReq(req: Request): IUploadFileParams {
  return merge(
    extractUploadFilesParamsFromQuery(req),
    extractUploadFilesParamsFromFormData(req)
  );
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
    uploadFile: wrapEndpointREST(
      uploadFile,
      ctx,
      undefined,
      extractUploadFilesParamsFromReq
    ),
    getFile: wrapEndpointREST(
      getFile,
      ctx,
      handleGetFileResponse,
      extractGetFileParamsFromReq
    ),
  };

  // TODO: look into using Content-Disposition header
  // TODO: look into using ETags
  app.get('/files/getFile', endpoints.getFile);
  app.post('/files/getFile', endpoints.getFile);
  app.post('/files/deleteFile', endpoints.deleteFile);
  app.post('/files/getFileDetails', endpoints.getFileDetails);
  app.post('/files/updateFileDetails', endpoints.updateFileDetails);
  app.post(
    '/files/uploadFile',
    upload.single(fileConstants.uploadedFileFieldName),
    endpoints.uploadFile
  );
}
