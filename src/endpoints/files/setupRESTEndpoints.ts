import {Express, Request, Response} from 'express';
import {last, merge} from 'lodash';
import * as multer from 'multer';
import {endpointConstants} from '../constants';
import {IBaseContext} from '../contexts/types';
import {endpointDecodeURIComponent, wrapEndpointREST} from '../utils';
import {fileConstants} from './constants';
import deleteFile from './deleteFile/handler';
import getFileDetails from './getFileDetails/handler';
import readFile from './readFile/handler';
import {IReadFileEndpointParams, ReadFileEndpoint} from './readFile/types';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {IUploadFileEndpointParams} from './uploadFile/types';

const uploadFilePath = fileConstants.routes.uploadFile;
const readFilePath = fileConstants.routes.readFile;

function handleReadFileResponse(res: Response, result: Awaited<ReturnType<ReadFileEndpoint>>) {
  res
    .set({
      'Content-Length': result.contentLength,
      'Content-Type': result.mimetype,
    })
    .status(endpointConstants.httpStatusCode.ok);
  result.stream.pipe(res);
}

export interface IReadFileEndpointQueryParams {
  w?: number;
  h?: number;
}

function extractReadFileParamsFromReq(req: Request): IReadFileEndpointParams {
  const p = req.path;
  const filepath = endpointDecodeURIComponent(last(p.split(readFilePath)));
  const width = endpointDecodeURIComponent(req.query.w);
  const height = endpointDecodeURIComponent(req.query.h);
  return {
    filepath,
    imageTranformation: {width, height},
    ...req.body,
  };
}

function extractUploadFilesParamsFromPath(req: Request): Partial<IUploadFileEndpointParams> {
  const p = req.path;
  const filepath = endpointDecodeURIComponent(last(p.split(uploadFilePath)));
  return {filepath};
}

function extractUploadFilesParamsFromFormData(req: Request): IUploadFileEndpointParams {
  const file = req.file;
  return {
    ...req.body,
    data: file?.buffer,
    mimetype: req.body.mimetype ?? file?.mimetype,
  };
}

function extractUploadFilesParamsFromReq(req: Request): IUploadFileEndpointParams {
  return merge(extractUploadFilesParamsFromPath(req), extractUploadFilesParamsFromFormData(req));
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
    uploadFile: wrapEndpointREST(uploadFile, ctx, undefined, extractUploadFilesParamsFromReq),
    readFile: wrapEndpointREST(readFile, ctx, handleReadFileResponse, extractReadFileParamsFromReq),
  };

  // TODO: look into using Content-Disposition header
  // TODO: look into using ETags
  app.get(`${readFilePath}*`, endpoints.readFile);
  app.delete(fileConstants.routes.deleteFile, endpoints.deleteFile);
  app.post(fileConstants.routes.getFileDetails, endpoints.getFileDetails);
  app.post(fileConstants.routes.updateFileDetails, endpoints.updateFileDetails);
  app.post(
    `${uploadFilePath}*`,
    upload.single(fileConstants.uploadedFileFieldName),
    endpoints.uploadFile
  );
}
