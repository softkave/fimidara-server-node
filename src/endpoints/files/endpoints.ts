import {Request, Response} from 'express';
import {last, merge} from 'lodash';
import {getFileExtenstion} from '../../utils/fns';
import {endpointConstants} from '../constants';
import {endpointDecodeURIComponent} from '../utils';
import {fileConstants} from './constants';
import deleteFile from './deleteFile/handler';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  getFilePresignedPathsEndpointDefinition,
  issueFilePresignedPathEndpointDefinition,
  readFileGETEndpointDefinition,
  readFilePOSTEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './endpoints.mddoc';
import getFileDetails from './getFileDetails/handler';
import getFilePresignedPaths from './getFilePresignedPaths/handler';
import issueFilePresignedPath from './issueFilePresignedPath/handler';
import {multerUploadFileExpressMiddleware} from './multer';
import readFile from './readFile/handler';
import {ReadFileEndpoint, ReadFileEndpointParams} from './readFile/types';
import {FilesExportedEndpoints} from './types';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {UploadFileEndpointParams} from './uploadFile/types';

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

function extractReadFileParamsFromReq(req: Request): ReadFileEndpointParams {
  const p = req.path;
  const filepath = endpointDecodeURIComponent(last(p.split(readFilePath)));
  const width = endpointDecodeURIComponent(req.query.w);
  const height = endpointDecodeURIComponent(req.query.h);
  return {
    filepath,
    imageResize: {width, height},
    ...req.body,
  };
}

function extractUploadFilesParamsFromPath(req: Request): Partial<UploadFileEndpointParams> {
  const p = req.path;
  const filepath = endpointDecodeURIComponent(last(p.split(uploadFilePath)));
  return {filepath};
}

function extractUploadFilesParamsFromFormData(req: Request): UploadFileEndpointParams {
  const file = req.file;
  return {
    ...req.body,
    data: file?.buffer,
    mimetype: req.body.mimetype ?? file?.mimetype,
    extension: req.body.extension ?? getFileExtenstion(file?.originalname),
  };
}

function extractUploadFilesParamsFromReq(req: Request): UploadFileEndpointParams {
  return merge(extractUploadFilesParamsFromPath(req), extractUploadFilesParamsFromFormData(req));
}

export function getFilesPublicHttpEndpoints() {
  const filesExportedEndpoints: FilesExportedEndpoints = {
    deleteFile: {
      fn: deleteFile,
      mddocHttpDefinition: deleteFileEndpointDefinition,
    },
    getFileDetails: {
      fn: getFileDetails,
      mddocHttpDefinition: getFileDetailsEndpointDefinition,
    },
    readFile: [
      {
        fn: readFile,
        mddocHttpDefinition: readFilePOSTEndpointDefinition,
        handleResponse: handleReadFileResponse,
        getDataFromReq: extractReadFileParamsFromReq,
      },
      {
        fn: readFile,
        mddocHttpDefinition: readFileGETEndpointDefinition,
        handleResponse: handleReadFileResponse,
        getDataFromReq: extractReadFileParamsFromReq,
      },
    ],
    updateFileDetails: {
      fn: updateFileDetails,
      mddocHttpDefinition: updateFileDetailsEndpointDefinition,
    },
    issueFilePresignedPath: {
      fn: issueFilePresignedPath,
      mddocHttpDefinition: issueFilePresignedPathEndpointDefinition,
    },
    getFilePresignedPaths: {
      fn: getFilePresignedPaths,
      mddocHttpDefinition: getFilePresignedPathsEndpointDefinition,
    },
    uploadFile: {
      fn: uploadFile,
      mddocHttpDefinition: uploadFileEndpointDefinition,
      getDataFromReq: extractUploadFilesParamsFromReq,
      expressRouteMiddleware: multerUploadFileExpressMiddleware.single(
        fileConstants.uploadedFileFieldName
      ),
    },
  };
  return filesExportedEndpoints;
}
