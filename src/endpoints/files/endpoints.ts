import busboy from 'connect-busboy';
import {Request, Response} from 'express';
import {first, isString, last} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {Readable} from 'stream';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {convertToArray} from '../../utils/fns.js';
import {tryGetResourceTypeFromId} from '../../utils/resource.js';
import {kEndpointConstants} from '../constants.js';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {InvalidRequestError} from '../errors.js';
import {populateMountUnsupportedOpNoteInNotFoundError} from '../fileBackends/mountUtils.js';
import {kFolderConstants} from '../folders/constants.js';
import {ExportedHttpEndpoint_HandleErrorFn} from '../types.js';
import {endpointDecodeURIComponent} from '../utils.js';
import {kFileConstants} from './constants.js';
import deleteFile from './deleteFile/handler.js';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  readFileGETEndpointDefinition,
  readFilePOSTEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './endpoints.mddoc.js';
import getFileDetails from './getFileDetails/handler.js';
import readFile from './readFile/handler.js';
import {
  ReadFileEndpoint,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types.js';
import {FilesExportedEndpoints} from './types.js';
import updateFileDetails from './updateFileDetails/handler.js';
import uploadFile from './uploadFile/handler.js';
import {UploadFileEndpointParams} from './uploadFile/types.js';

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
  result: Awaited<ReturnType<ReadFileEndpoint>>,
  req: Request,
  input: ReadFileEndpointParams
) {
  // console.dir({input, req, result}, {depth: 7});

  if (input.download) {
    const filename =
      result.name +
      (result.ext ? `${kFileConstants.nameextSeparator}${result.ext}` : '');

    // TODO: correctly set filename and filename* based on
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#as_a_response_header_for_the_main_body
    // res.setHeader('Content-Disposition', `attachment; filename*="${filename}"`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  const responseHeaders: AnyObject = {
    'Content-Length': result.contentLength,
    'Content-Type': result.mimetype,
  };
  res.set(responseHeaders).status(kEndpointConstants.httpStatusCode.ok);

  // TODO: set timeout for stream after which, we destroy it, to avoid leaving
  // a stream on indefinitely or waiting resources (memory)
  result.stream.on('end', () => {
    console.log('stream.end');
    res.end();
  });
  result.stream.on('data', data => {
    console.log('stream.data');
    console.log(data);
    res.write(data);
  });

  // TODO: better handle error
  result.stream.on('error', error => {
    console.log('stream.error');
    console.error(error);
    res.end();
  });

  // result.stream.pipe(res);
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
    tryGetResourceTypeFromId(maybeFileId) === kFimidaraResourceType.File &&
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
      withoutEnlargement: endpointDecodeURIComponent(query.withoutEnlargement),
      background: endpointDecodeURIComponent(query.bg),
      position: endpointDecodeURIComponent(query.pos),
      height: endpointDecodeURIComponent(query.h),
      width: endpointDecodeURIComponent(query.w),
      fit: endpointDecodeURIComponent(query.fit),
    },
    imageFormat: endpointDecodeURIComponent(query.format),
    download: query.download,
    ...req.body,
  };
}

async function extractUploadFileParamsFromReq(
  req: Request
): Promise<UploadFileEndpointParams> {
  let waitTimeoutHandle: NodeJS.Timeout | undefined = undefined;
  const contentEncoding = req.headers['content-encoding'];
  const contentLength = req.headers['content-length'];
  const description =
    req.headers[kFileConstants.headers['x-fimidara-file-description']];
  const mimeType =
    req.headers[kFileConstants.headers['x-fimidara-file-mimetype']];

  appAssert(
    req.busboy,
    new InvalidRequestError('Invalid multipart/formdata request')
  );

  return new Promise((resolve, reject) => {
    // Wait for data stream or end if timeout exceeded. This is to prevent
    // waiting forever, for whatever reason if stream event is not fired.
    waitTimeoutHandle = setTimeout(() => {
      reject(
        new Error(
          `Upload file wait timeout ${kFileStreamWaitTimeoutMS} exceeded`
        )
      );
    }, kFileStreamWaitTimeoutMS);

    req.busboy.on('error', (error): void => {
      kUtilsInjectables.logger().error('uploadFile req busboy error', error);
    });

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
        mimetype: isString(mimeType) && mimeType ? mimeType : info.mimeType,
        encoding: info.encoding ?? contentEncoding,
        description: description
          ? first(convertToArray(description))
          : undefined,
        data: stream,
        // TODO: this is safe because there's Joi validation at the endpoint
        // level
        size: contentLength as unknown as number,
      });
    });

    req.busboy.on('field', (name, value, info) => {
      if (name !== kFileConstants.uploadedFileFieldName) {
        return;
      }

      // Clear wait timeout, we have file stream, otherwise the request will
      // fail
      clearTimeout(waitTimeoutHandle);
      const matcher = extractFilepathOrIdFromReqPath(
        req,
        kFileConstants.routes.uploadFile
      );
      resolve({
        ...matcher,
        mimetype: isString(mimeType) && mimeType ? mimeType : info.mimeType,
        encoding: info.encoding ?? contentEncoding,
        data: Readable.from(value),
        description: description
          ? first(convertToArray(description))
          : undefined,
        // TODO: this is safe because there's Joi validation at the endpoint
        // level
        size: contentLength as unknown as number,
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

    interface ActiveBusboy {
      _fileStream?: Readable;
    }

    // Handle busboy's _fileStream on error, called on destroy() which'd crash
    // the app otherwise
    if ((req.busboy as ActiveBusboy)?._fileStream) {
      (req.busboy as ActiveBusboy)?._fileStream?.on('error', error => {
        kUtilsInjectables
          .logger()
          .error('uploadFile req busboy _fileStream error', error);
      });
    }

    req.unpipe(req.busboy);
    req.destroy();
    req.busboy.destroy();
  }
}

export function getFilesPublicHttpEndpoints() {
  const filesExportedEndpoints: FilesExportedEndpoints = {
    deleteFile: {
      mddocHttpDefinition: deleteFileEndpointDefinition,
      handleError: handleNotFoundError,
      fn: deleteFile,
    },
    getFileDetails: {
      mddocHttpDefinition: getFileDetailsEndpointDefinition,
      handleError: handleNotFoundError,
      fn: getFileDetails,
    },
    readFile: [
      {
        mddocHttpDefinition: readFilePOSTEndpointDefinition,
        getDataFromReq: extractReadFileParamsFromReq,
        handleResponse: handleReadFileResponse,
        handleError: handleNotFoundError,
        fn: readFile,
      },
      {
        // TODO: special case, sdkparams is inferred from endpoint, so it's
        // expecting a request body, but it's a GET request, and there shouldn't
        // be one. Fix will take more time to fix, compared to ts-ignore, so,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mddocHttpDefinition: readFileGETEndpointDefinition,
        getDataFromReq: extractReadFileParamsFromReq,
        handleResponse: handleReadFileResponse,
        handleError: handleNotFoundError,
        fn: readFile,
      },
    ],
    updateFileDetails: {
      mddocHttpDefinition: updateFileDetailsEndpointDefinition,
      handleError: handleNotFoundError,
      fn: updateFileDetails,
    },
    uploadFile: {
      expressRouteMiddleware: busboy({
        limits: kFileConstants.multipartLimits,
      }),
      mddocHttpDefinition: uploadFileEndpointDefinition,
      getDataFromReq: extractUploadFileParamsFromReq,
      handleError: handleNotFoundError,
      cleanup: cleanupUploadFileReq,
      fn: uploadFile,
    },
  };
  return filesExportedEndpoints;
}
