import busboy from 'connect-busboy';
import {Request, Response} from 'express';
import {first, last} from 'lodash';
import {AppResourceTypeMap} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {toArray} from '../../utils/fns';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {endpointConstants} from '../constants';
import {InvalidRequestError} from '../errors';
import {folderConstants} from '../folders/constants';
import {endpointDecodeURIComponent} from '../utils';
import {fileConstants} from './constants';
import deleteFile from './deleteFile/handler';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  getPresignedPathsForFilesEndpointDefinition,
  issueFilePresignedPathEndpointDefinition,
  readFileGETEndpointDefinition,
  readFilePOSTEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './endpoints.mddoc';
import getFileDetails from './getFileDetails/handler';
import getPresignedPathsForFiles from './getPresignedPathsForFiles/handler';
import issueFilePresignedPath from './issueFilePresignedPath/handler';
import readFile from './readFile/handler';
import {
  ReadFileEndpoint,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types';
import {FilesExportedEndpoints} from './types';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';
import {UploadFileEndpointParams} from './uploadFile/types';

const kFileStreamWaitTimeoutMS = 10000; // 10 seconds

function handleReadFileResponse(
  res: Response,
  result: Awaited<ReturnType<ReadFileEndpoint>>
) {
  res
    .set({
      'Content-Length': result.contentLength,
      'Content-Type': result.mimetype,
    })
    .status(endpointConstants.httpStatusCode.ok);

  // TODO: set timeout for stream after which, we destroy it, to avoid leaving
  // a stream on indefinitely or waiting resources (memory)
  result.stream.pipe(res);
}

/**
 * Tries to extract filepath from request path and checks if it's possibly a
 * file ID. Supports formats `/workspace-rootname/file000-remaining-file-id` and
 * `/workspace-rootname/folder/filename`
 */
function extractFilepathOrIdFromReqPath(req: Request, endpointPath: string) {
  const reqPath = req.path;
  let filepath = endpointDecodeURIComponent(last(reqPath.split(endpointPath)));
  let fileId: string | undefined = undefined;
  const maybeFileId = filepath?.replace(folderConstants.nameSeparator, '');

  if (
    maybeFileId &&
    tryGetResourceTypeFromId(maybeFileId) === AppResourceTypeMap.File &&
    maybeFileId.includes(folderConstants.nameSeparator) === false
  ) {
    fileId = maybeFileId;
    filepath = undefined;
  }

  return {fileId, filepath};
}

function extractReadFileParamsFromReq(req: Request): ReadFileEndpointParams {
  const query = req.query as Partial<ReadFileEndpointHttpQuery>;
  return {
    ...extractFilepathOrIdFromReqPath(req, fileConstants.routes.readFile),
    imageResize: {
      width: endpointDecodeURIComponent(query.w),
      height: endpointDecodeURIComponent(query.h),
      background: endpointDecodeURIComponent(query.bg),
      fit: endpointDecodeURIComponent(query.fit),
      position: endpointDecodeURIComponent(query.pos),
      withoutEnlargement: endpointDecodeURIComponent(query.withoutEnlargement),
    },
    imageFormat: endpointDecodeURIComponent(query.format),
    ...req.body,
  };
}

async function extractUploadFileParamsFromReq(
  req: Request
): Promise<UploadFileEndpointParams> {
  let waitTimeoutHandle: NodeJS.Timeout | undefined = undefined;
  const contentLength = req.headers['content-length'];
  const contentEncoding = req.headers['content-encoding'];
  const contentType = req.headers[fileConstants.headers['x-fimidara-file-mimetype']];
  const description = req.headers[fileConstants.headers['x-fimidara-file-description']];

  appAssert(req.busboy, new InvalidRequestError('Invalid multipart/formdata request.'));
  appAssert(
    contentLength,
    new InvalidRequestError('The Content-Length HTTP header is required.')
  );

  return new Promise((resolve, reject) => {
    // Wait for data stream or end if timeout exceeded. This is to prevent
    // waiting forever, for whatever reason if stream event is not fired.
    waitTimeoutHandle = setTimeout(() => {
      reject(new Error(`Upload file wait timeout ${kFileStreamWaitTimeoutMS} exceeded.`));
    }, kFileStreamWaitTimeoutMS);

    req.busboy.on('file', (filename, stream, info) => {
      // Clear wait timeout, we have file stream, otherwise the request will
      // fail
      clearTimeout(waitTimeoutHandle);
      const matcher = extractFilepathOrIdFromReqPath(
        req,
        fileConstants.routes.uploadFile
      );
      resolve({
        ...matcher,
        data: stream,
        size: Number(contentLength),
        encoding: info.encoding ?? contentEncoding,
        mimetype: info.mimeType ?? contentType,
        description: description ? first(toArray(description)) : undefined,
      });
    });
    req.pipe(req.busboy);
  });
}

function cleanupUploadFileReq(req: Request) {
  if (req.busboy) {
    // We are done processing request, either because of an error, file stream
    // wait timeout exceeded, or file has been persisted. Either way, swiftly
    // and immediately destroy the stream to avoid memory leakage.
    req.busboy.destroy();
  }
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
        // TODO: special case, sdkparams is inferred from endpoint, so it's
        // expecting a request body, but it's a GET request, and there shouldn't
        // be one. Fix will take more time to fix, compared to ts-ignore, so,
        // TODO
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    getPresignedPathsForFiles: {
      fn: getPresignedPathsForFiles,
      mddocHttpDefinition: getPresignedPathsForFilesEndpointDefinition,
    },
    uploadFile: {
      fn: uploadFile,
      mddocHttpDefinition: uploadFileEndpointDefinition,
      expressRouteMiddleware: busboy({
        limits: fileConstants.multipartLimits,
      }),
      getDataFromReq: extractUploadFileParamsFromReq,
      cleanup: cleanupUploadFileReq,
    },
  };
  return filesExportedEndpoints;
}
