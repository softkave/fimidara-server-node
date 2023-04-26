import {FieldBinary} from '../../mddoc/mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {DeleteFileEndpoint, DeleteFileEndpointParams} from './deleteFile/types';
import {
  GetFileDetailsEndpoint,
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult,
} from './getFileDetails/types';
import {
  ReadFileEndpoint,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types';
import {
  UpdateFileDetailsEndpoint,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
} from './updateFileDetails/types';
import {
  UploadFileEndpoint,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
} from './uploadFile/types';

export type ReadFileHttpEndpoint = HttpEndpoint<
  ReadFileEndpoint,
  ReadFileEndpointParams,
  FieldBinary,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
  FileMatcherPathParameters,
  ReadFileEndpointHttpQuery
>;
export type DeleteFileHttpEndpoint = HttpEndpoint<
  DeleteFileEndpoint,
  DeleteFileEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetFileDetailsHttpEndpoint = HttpEndpoint<
  GetFileDetailsEndpoint,
  GetFileDetailsEndpointParams,
  GetFileDetailsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateFileDetailsHttpEndpoint = HttpEndpoint<
  UpdateFileDetailsEndpoint,
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UploadFileHttpEndpoint = HttpEndpoint<
  UploadFileEndpoint,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
  FileMatcherPathParameters
>;

export type FilesExportedEndpoints = {
  readFile: ExportedHttpEndpointWithMddocDefinition<ReadFileHttpEndpoint>;
  deleteFile: ExportedHttpEndpointWithMddocDefinition<DeleteFileHttpEndpoint>;
  getFileDetails: ExportedHttpEndpointWithMddocDefinition<GetFileDetailsHttpEndpoint>;
  updateFileDetails: ExportedHttpEndpointWithMddocDefinition<UpdateFileDetailsHttpEndpoint>;
  uploadFile: ExportedHttpEndpointWithMddocDefinition<UploadFileHttpEndpoint>;
};

export type FileMatcherPathParameters = {
  filepath?: string;
};
