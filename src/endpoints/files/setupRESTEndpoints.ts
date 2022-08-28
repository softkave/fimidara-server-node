import {Express, Request, Response} from 'express';
import {last, merge} from 'lodash';
import * as multer from 'multer';
import {endpointConstants} from '../constants';
import {IBaseContext} from '../contexts/types';
import {wrapEndpointREST} from '../utils';
import {fileConstants} from './constants';
import deleteFile from './deleteFile/handler';
import getFile from './getFile/handler';
import {GetFileEndpoint, IGetFileEndpointParams} from './getFile/types';
import getFileDetails from './getFileDetails/handler';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {IUploadFileEndpointParams} from './uploadFile/types';

const uploadFilePath = '/files/uploadFile';
const getFilePath = '/files/getFile';

function handleGetFileResponse(
  res: Response,
  result: Awaited<ReturnType<GetFileEndpoint>>
) {
  res
    .set({
      'Content-Length': result.contentLength,
      'Content-Type': result.mimetype,
    })
    .status(endpointConstants.httpStatusCode.ok);
  result.stream.pipe(res);
}

function extractGetFileParamsFromReq(req: Request): IGetFileEndpointParams {
  const p = req.path;
  const filepath = last(p.split(getFilePath));
  const width = req.query.w;
  const height = req.query.h;
  return {
    filepath,
    imageTranformation: {width, height},
    ...req.body,
  };
}

function extractUploadFilesParamsFromPath(
  req: Request
): Partial<IUploadFileEndpointParams> {
  const p = req.path;
  const filepath = last(p.split(uploadFilePath));
  return {filepath};
}

function extractUploadFilesParamsFromFormData(
  req: Request
): IUploadFileEndpointParams {
  const file = req.file;
  return {
    ...req.body,
    data: file?.buffer,
    mimetype: req.body.mimetype || file?.mimetype,
  };
}

function extractUploadFilesParamsFromReq(
  req: Request
): IUploadFileEndpointParams {
  return merge(
    extractUploadFilesParamsFromPath(req),
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
  app.get(`${getFilePath}*`, endpoints.getFile);
  app.delete('/files/deleteFile', endpoints.deleteFile);
  app.post('/files/getFileDetails', endpoints.getFileDetails);
  app.post('/files/updateFileDetails', endpoints.updateFileDetails);
  app.post(
    `${uploadFilePath}*`,
    upload.single(fileConstants.uploadedFileFieldName),
    endpoints.uploadFile
  );
}
