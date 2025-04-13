import {FieldBinaryType} from '../../mddoc/mddoc.js';
import {EmptyObject} from '../../utils/types.js';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types.js';
import {CompleteMultipartUploadEndpoint} from './completeMultipartUpload/types.js';
import {DeleteFileEndpoint} from './deleteFile/types.js';
import {GetFileDetailsEndpoint} from './getFileDetails/types.js';
import {ListPartsEndpoint} from './listParts/types.js';
import {
  ReadFileEndpoint,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types.js';
import {StartMultipartUploadEndpoint} from './startMultipartUpload/types.js';
import {UpdateFileDetailsEndpoint} from './updateFileDetails/types.js';
import {
  UploadFileEndpoint,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
} from './uploadFile/types.js';

export type UploadFileEndpointHTTPHeaders =
  HttpEndpointRequestHeaders_AuthOptional_ContentType & {
    'x-fimidara-file-encoding'?: string;
    'x-fimidara-file-description'?: string;
    'x-fimidara-file-mimetype'?: string;
    'x-fimidara-file-size'?: number;
    'x-fimidara-multipart-id'?: string;
    'x-fimidara-multipart-part'?: number;
    'content-length': number;
  };

export type ReadFileEndpointHTTPHeaders =
  HttpEndpointResponseHeaders_ContentType_ContentLength & {
    'Content-Disposition'?: string;
  };

export type ReadFilePOSTHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ ReadFileEndpoint,
  /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional_ContentType,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ ReadFileEndpointHttpQuery,
  /** TRequestBody */ ReadFileEndpointParams,
  /** TResponseHeaders */ ReadFileEndpointHTTPHeaders,
  /** TResponseBody */ FieldBinaryType,
  /** TSdkparams */ ReadFileEndpointParams
>;
export type ReadFileGETHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ ReadFileEndpoint,
  /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ ReadFileEndpointHttpQuery,
  /** TRequestBody */ {},
  /** TResponseHeaders */ ReadFileEndpointHTTPHeaders,
  /** TResponseBody */ FieldBinaryType,
  /** TSdkparams */ ReadFileEndpointParams
>;
export type DeleteFileHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteFileEndpoint>;
export type GetFileDetailsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileDetailsEndpoint>;
export type ListPartsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ListPartsEndpoint>;
export type UpdateFileDetailsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateFileDetailsEndpoint>;
export type UploadFileEndpointSdkParams = UploadFileEndpointParams;
export type UploadFileHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ UploadFileEndpoint,
  /** TRequestHeaders */ UploadFileEndpointHTTPHeaders,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ EmptyObject,
  /** TRequestBody */ Pick<UploadFileEndpointParams, 'data'>,
  /** TResponseHeaders */ HttpEndpointResponseHeaders_ContentType_ContentLength,
  /** TResponseBody */ UploadFileEndpointResult,
  /** TSdkparams */ UploadFileEndpointSdkParams
>;
export type StartMultipartUploadHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<StartMultipartUploadEndpoint>;
export type CompleteMultipartUploadHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<CompleteMultipartUploadEndpoint>;

export type FilesExportedEndpoints = {
  readFile: [ReadFilePOSTHttpEndpoint, ReadFileGETHttpEndpoint];
  deleteFile: DeleteFileHttpEndpoint;
  getFileDetails: GetFileDetailsHttpEndpoint;
  updateFileDetails: UpdateFileDetailsHttpEndpoint;
  uploadFile: UploadFileHttpEndpoint;
  listParts: ListPartsHttpEndpoint;
  startMultipartUpload: StartMultipartUploadHttpEndpoint;
  completeMultipartUpload: CompleteMultipartUploadHttpEndpoint;
};

export type FileMatcherPathParameters = {
  filepathOrId?: string;
};
