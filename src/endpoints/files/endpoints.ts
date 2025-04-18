import busboy from 'busboy';
import {Request, Response} from 'express';
import {first, isNumber, isString, last} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {Readable} from 'stream';
import {finished} from 'stream/promises';
import {kIjxUtils} from '../../contexts/ijx/injectables.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {convertToArray} from '../../utils/fns.js';
import {tryGetResourceTypeFromId} from '../../utils/resource.js';
import {kEndpointConstants} from '../constants.js';
import {populateMountUnsupportedOpNoteInNotFoundError} from '../fileBackends/mountUtils.js';
import {kFolderConstants} from '../folders/constants.js';
import {ExportedHttpEndpoint_HandleErrorFn, kEndpointTag} from '../types.js';
import {endpointDecodeURIComponent} from '../utils.js';
import completeMultipartUpload from './completeMultipartUpload/handler.js';
import {kFileConstants} from './constants.js';
import deleteFile from './deleteFile/handler.js';
import {
  completeMultipartUploadEndpointDefinition,
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  listPartsEndpointDefinition,
  readFileGETEndpointDefinition,
  readFilePOSTEndpointDefinition,
  startMultipartUploadEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './endpoints.mddoc.js';
import getFileDetails from './getFileDetails/handler.js';
import listParts from './listParts/handler.js';
import readFile from './readFile/handler.js';
import {
  ReadFileEndpoint,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types.js';
import startMultipartUpload from './startMultipartUpload/handler.js';
import {FilesExportedEndpoints} from './types.js';
import updateFileDetails from './updateFileDetails/handler.js';
import uploadFile from './uploadFile/handler.js';
import {UploadFileEndpointParams} from './uploadFile/types.js';

interface ActiveBusboy {
  _fileStream?: Readable;
}

interface ReqWithBusboy {
  busboy?: busboy.Busboy;
}

const kFileStreamWaitTimeoutMS = 60_000; // 1 minute

const handleNotFoundError: ExportedHttpEndpoint_HandleErrorFn = (
  res,
  proccessedErrors
) => {
  populateMountUnsupportedOpNoteInNotFoundError(proccessedErrors);

  // populate notes only, and defer handling to server
  return true;
};

async function handleReadFileResponse(
  res: Response,
  result: Awaited<ReturnType<ReadFileEndpoint>>,
  req: Request,
  input: ReadFileEndpointParams
) {
  if (input.download) {
    const filename =
      result.name +
      (result.ext ? `${kFileConstants.nameExtSeparator}${result.ext}` : '');

    // TODO: correctly set filename and filename* based on
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#as_a_response_header_for_the_main_body
    // res.setHeader('Content-Disposition', `attachment; filename*="${filename}"`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  const responseHeaders: AnyObject = {
    'Content-Length': result.contentLength,
  };

  if (result.mimetype) {
    responseHeaders['Content-Type'] = result.mimetype;
  }

  res.set(responseHeaders).status(kEndpointConstants.httpStatusCode.ok);
  result.stream.pipe(res, {end: true});
  await finished(res, {cleanup: true});
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
  const contentEncoding =
    req.headers[kFileConstants.headers['x-fimidara-file-encoding']];
  const contentLength =
    req.headers['content-length'] ||
    req.headers[kFileConstants.headers['x-fimidara-file-size']];
  const description =
    req.headers[kFileConstants.headers['x-fimidara-file-description']];
  const mimeType =
    req.headers[kFileConstants.headers['x-fimidara-file-mimetype']];
  const clientMultipartId =
    req.headers[kFileConstants.headers['x-fimidara-multipart-id']];
  const part = parseInt(
    req.headers[kFileConstants.headers['x-fimidara-multipart-part']] as string
  );

  const bb = busboy({
    limits: kFileConstants.multipartLimits,
    headers: req.headers,
  });
  (req as ReqWithBusboy).busboy = bb;

  const p = new Promise<UploadFileEndpointParams>((resolve, reject) => {
    // Wait for data stream or end if timeout exceeded. This is to prevent
    // waiting forever, for whatever reason if stream event is not fired.
    waitTimeoutHandle = setTimeout(() => {
      reject(
        new Error(
          `Upload file wait timeout ${kFileStreamWaitTimeoutMS} exceeded`
        )
      );
    }, kFileStreamWaitTimeoutMS);

    bb.on('error', (error): void => {
      kIjxUtils.logger().error('uploadFile req busboy error', error);
    });

    bb.on('file', (filename, stream, info) => {
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
        encoding: isString(contentEncoding) ? contentEncoding : info.encoding,
        description: description
          ? first(convertToArray(description))
          : undefined,
        data: stream,
        // TODO: this is safe because there's Joi validation at the endpoint
        // level
        size: contentLength as unknown as number,
        clientMultipartId: isString(clientMultipartId)
          ? clientMultipartId
          : undefined,
        part: isNumber(part) && !isNaN(part) ? part : undefined,
      });
    });

    bb.on('field', (name, value, info) => {
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
        encoding: isString(contentEncoding) ? contentEncoding : info.encoding,
        data: Readable.from(value),
        description: description
          ? first(convertToArray(description))
          : undefined,
        // TODO: this is safe because there's Joi validation at the endpoint
        // level
        size: contentLength as unknown as number,
        part: isNumber(part) && !isNaN(part) ? part : undefined,
        clientMultipartId: isString(clientMultipartId)
          ? clientMultipartId
          : undefined,
      });
    });
  });

  req.pipe(bb);
  return p;
}

function cleanupUploadFileReq(req: Request) {
  if ((req as ReqWithBusboy).busboy) {
    // We are done processing request, either because of an error, file stream
    // wait timeout exceeded, or file has been persisted. Either way,
    // immediately destroy the stream to avoid memory leakage.

    // Handle busboy's _fileStream on error, called on destroy() which'd crash
    // the app otherwise
    if (((req as ReqWithBusboy).busboy as ActiveBusboy)?._fileStream) {
      ((req as ReqWithBusboy).busboy as ActiveBusboy)?._fileStream?.on(
        'error',
        error => {
          kIjxUtils
            .logger()
            .error('uploadFile req busboy _fileStream error', error);
        }
      );
    }

    req.unpipe((req as ReqWithBusboy).busboy);
    (req as ReqWithBusboy)?.busboy?.destroy();
    req.destroy();
  }
}

export function getFilesHttpEndpoints() {
  const filesExportedEndpoints: FilesExportedEndpoints = {
    deleteFile: {
      tag: [kEndpointTag.public],
      mddocHttpDefinition: deleteFileEndpointDefinition,
      handleError: handleNotFoundError,
      fn: deleteFile,
    },
    getFileDetails: {
      tag: [kEndpointTag.public],
      mddocHttpDefinition: getFileDetailsEndpointDefinition,
      handleError: handleNotFoundError,
      fn: getFileDetails,
    },
    listParts: {
      tag: [kEndpointTag.public],
      mddocHttpDefinition: listPartsEndpointDefinition,
      handleError: handleNotFoundError,
      fn: listParts,
    },
    readFile: [
      {
        tag: [kEndpointTag.public],
        mddocHttpDefinition: readFilePOSTEndpointDefinition,
        getDataFromReq: extractReadFileParamsFromReq,
        handleResponse: handleReadFileResponse,
        handleError: handleNotFoundError,
        fn: readFile,
      },
      {
        tag: [kEndpointTag.public],
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
      tag: [kEndpointTag.public],
      mddocHttpDefinition: updateFileDetailsEndpointDefinition,
      handleError: handleNotFoundError,
      fn: updateFileDetails,
    },
    uploadFile: {
      tag: [kEndpointTag.public],
      mddocHttpDefinition: uploadFileEndpointDefinition,
      getDataFromReq: extractUploadFileParamsFromReq,
      handleError: handleNotFoundError,
      cleanup: cleanupUploadFileReq,
      fn: uploadFile,
    },
    startMultipartUpload: {
      tag: [kEndpointTag.public],
      mddocHttpDefinition: startMultipartUploadEndpointDefinition,
      handleError: handleNotFoundError,
      fn: startMultipartUpload,
    },
    completeMultipartUpload: {
      tag: [kEndpointTag.public],
      mddocHttpDefinition: completeMultipartUploadEndpointDefinition,
      handleError: handleNotFoundError,
      fn: completeMultipartUpload,
    },
  };
  return filesExportedEndpoints;
}
