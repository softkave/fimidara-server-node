import {FieldBinaryType} from '../../mddoc/mddoc.js';
import {EmptyObject} from '../../utils/types.js';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types.js';
import {SysDeleteFileEndpoint} from './deleteFile/types.js';
import {GetFileDetailsEndpoint} from './getFileDetails/types.js';
import {GetPartDetailsEndpoint} from './getPartDetails/types.js';
import {
  ReadFileEndpointHttpQuery,
  SysReadFileEndpoint,
  SysReadFileEndpointParams,
} from './readFile/types.js';
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
    'x-fimidara-multipart-is-last-part'?: boolean;
    'content-length': number;
  };

export type ReadFileEndpointHTTPHeaders =
  HttpEndpointResponseHeaders_ContentType_ContentLength & {
    'Content-Disposition'?: string;
  };

export type ReadFilePOSTHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ SysReadFileEndpoint,
  /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional_ContentType,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ ReadFileEndpointHttpQuery,
  /** TRequestBody */ SysReadFileEndpointParams,
  /** TResponseHeaders */ ReadFileEndpointHTTPHeaders,
  /** TResponseBody */ FieldBinaryType,
  /** TSdkparams */ SysReadFileEndpointParams
>;
export type ReadFileGETHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ SysReadFileEndpoint,
  /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ ReadFileEndpointHttpQuery,
  /** TRequestBody */ {},
  /** TResponseHeaders */ ReadFileEndpointHTTPHeaders,
  /** TResponseBody */ FieldBinaryType,
  /** TSdkparams */ SysReadFileEndpointParams
>;
export type DeleteFileHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<SysDeleteFileEndpoint>;
export type GetFileDetailsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileDetailsEndpoint>;
export type GetPartDetailsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetPartDetailsEndpoint>;
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

export type FilesExportedEndpoints = {
  readFile: [ReadFilePOSTHttpEndpoint, ReadFileGETHttpEndpoint];
  deleteFile: DeleteFileHttpEndpoint;
  getFileDetails: GetFileDetailsHttpEndpoint;
  updateFileDetails: UpdateFileDetailsHttpEndpoint;
  uploadFile: UploadFileHttpEndpoint;
  getPartDetails: GetPartDetailsHttpEndpoint;
};

export type FileMatcherPathParameters = {
  filepathOrId?: string;
};
