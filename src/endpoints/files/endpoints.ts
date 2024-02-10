import busboy from 'connect-busboy';
import {Request, Response} from 'express';
import {first, last} from 'lodash';
import {kAppResourceType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {toArray} from '../../utils/fns';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {kEndpointConstants} from '../constants';
import {InvalidRequestError} from '../errors';
import {populateMountUnsupportedOpNoteInNotFoundError} from '../fileBackends/mountUtils';
import {kFolderConstants} from '../folders/constants';
import {ExportedHttpEndpoint_HandleErrorFn} from '../types';
import {endpointDecodeURIComponent} from '../utils';
import {kFileConstants} from './constants';
import deleteFile from './deleteFile/handler';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  getPresignedPathsForFilesEndpointDefinition,
  issueFilePresignedPathEndpointDefinition,
  readFilePOSTEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './endpoints.mddoc';
import getFileDetails from './getFileDetails/handler';
import getPresignedPathsForFiles from './getPresignedPaths/handler';
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

const handleNotFoundError: ExportedHttpEndpoint_HandleErrorFn = (
  res,
  proccessedErrors
) => {
  populateMountUnsupportedOpNoteInNotFoundError(proccessedErrors);

  // populate notes only, and defer handling to server
  return true;
};

function handleReadFileResponse(
  res: Response,
  result: Awaited<ReturnType<ReadFileEndpoint>>
) {
  res
    .set({
      'Content-Length': result.contentLength,
      'Content-Type': result.mimetype,
    })
    .status(kEndpointConstants.httpStatusCode.ok);

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
  const maybeFileId = filepath?.replace(kFolderConstants.separator, '');

  if (
    maybeFileId &&
    tryGetResourceTypeFromId(maybeFileId) === kAppResourceType.File &&
    maybeFileId.includes(kFolderConstants.separator) === false
  ) {
    fileId = maybeFileId;
    filepath = undefined;
  }

  return {fileId, filepath};
}

function extractReadFileParamsFromReq(req: Request): ReadFileEndpointParams {
  const query = req.query as Partial<ReadFileEndpointHttpQuery>;
  return {
    ...extractFilepathOrIdFromReqPath(req, kFileConstants.routes.readFile),
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
  const contentEncoding = req.headers['content-encoding'];
  const description = req.headers[kFileConstants.headers['x-fimidara-file-description']];
  appAssert(req.busboy, new InvalidRequestError('Invalid multipart/formdata request'));

  return new Promise((resolve, reject) => {
    // Wait for data stream or end if timeout exceeded. This is to prevent
    // waiting forever, for whatever reason if stream event is not fired.
    waitTimeoutHandle = setTimeout(() => {
      reject(new Error(`Upload file wait timeout ${kFileStreamWaitTimeoutMS} exceeded`));
    }, kFileStreamWaitTimeoutMS);

    req.busboy.on('file', (filename, stream, info) => {
      // Clear wait timeout, we have file stream, otherwise the request will
      // fail
      clearTimeout(waitTimeoutHandle);
      const matcher = extractFilepathOrIdFromReqPath(
        req,
        kFileConstants.routes.uploadFile
      );
      resolve({
        ...matcher,
        data: stream,
        encoding: info.encoding ?? contentEncoding,
        mimetype: info.mimeType,
        description: description ? first(toArray(description)) : undefined,
      });
    });

    req.pipe(req.busboy);
  });
}

function cleanupUploadFileReq(req: Request) {
  if (req.busboy) {
    // We are done processing request, either because of an error, file stream
    // wait timeout exceeded, or file has been persisted. Either way,
    // immediately destroy the stream to avoid memory leakage.
    req.busboy.destroy();
  }
}

export function getFilesPublicHttpEndpoints() {
  const filesExportedEndpoints: FilesExportedEndpoints = {
    deleteFile: {
      fn: deleteFile,
      mddocHttpDefinition: deleteFileEndpointDefinition,
      handleError: handleNotFoundError,
    },
    getFileDetails: {
      fn: getFileDetails,
      mddocHttpDefinition: getFileDetailsEndpointDefinition,
      handleError: handleNotFoundError,
    },
    readFile: [
      {
        fn: readFile,
        mddocHttpDefinition: readFilePOSTEndpointDefinition,
        handleResponse: handleReadFileResponse,
        getDataFromReq: extractReadFileParamsFromReq,
        handleError: handleNotFoundError,
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
        handleError: handleNotFoundError,
      },
    ],
    updateFileDetails: {
      fn: updateFileDetails,
      mddocHttpDefinition: updateFileDetailsEndpointDefinition,
      handleError: handleNotFoundError,
    },
    issueFilePresignedPath: {
      fn: issueFilePresignedPath,
      mddocHttpDefinition: issueFilePresignedPathEndpointDefinition,
      handleError: handleNotFoundError,
    },
    getPresignedPathsForFiles: {
      fn: getPresignedPathsForFiles,
      mddocHttpDefinition: getPresignedPathsForFilesEndpointDefinition,
      handleError: handleNotFoundError,
    },
    uploadFile: {
      fn: uploadFile,
      mddocHttpDefinition: uploadFileEndpointDefinition,
      expressRouteMiddleware: busboy({
        limits: kFileConstants.multipartLimits,
      }),
      getDataFromReq: extractUploadFileParamsFromReq,
      cleanup: cleanupUploadFileReq,
      handleError: handleNotFoundError,
    },
  };
  return filesExportedEndpoints;
}
