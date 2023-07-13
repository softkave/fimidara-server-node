import {FieldBinary} from '../../mddoc/mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthOptional,
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
  GetPresignedPathsForFilesEndpoint,
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult,
} from './getPresignedPathsForFiles/types';
import {
  IssueFilePresignedPathEndpoint,
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult,
} from './issueFilePresignedPath/types';
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

export type ReadFilePOSTHttpEndpoint = HttpEndpoint<
  ReadFileEndpoint,
  ReadFileEndpointParams,
  FieldBinary,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
  FileMatcherPathParameters,
  ReadFileEndpointHttpQuery
>;
export type ReadFileGETHttpEndpoint = HttpEndpoint<
  ReadFileEndpoint,
  undefined,
  FieldBinary,
  HttpEndpointRequestHeaders_AuthOptional,
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
export type IssueFilePresignedPathHttpEndpoint = HttpEndpoint<
  IssueFilePresignedPathEndpoint,
  IssueFilePresignedPathEndpointParams,
  IssueFilePresignedPathEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetPresignedPathsForFilesHttpEndpoint = HttpEndpoint<
  GetPresignedPathsForFilesEndpoint,
  GetPresignedPathsForFilesEndpointParams,
  GetPresignedPathsForFilesEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type FilesExportedEndpoints = {
  readFile: [
    ExportedHttpEndpointWithMddocDefinition<ReadFilePOSTHttpEndpoint>,
    ExportedHttpEndpointWithMddocDefinition<ReadFileGETHttpEndpoint>
  ];
  deleteFile: ExportedHttpEndpointWithMddocDefinition<DeleteFileHttpEndpoint>;
  getFileDetails: ExportedHttpEndpointWithMddocDefinition<GetFileDetailsHttpEndpoint>;
  updateFileDetails: ExportedHttpEndpointWithMddocDefinition<UpdateFileDetailsHttpEndpoint>;
  issueFilePresignedPath: ExportedHttpEndpointWithMddocDefinition<IssueFilePresignedPathHttpEndpoint>;
  getPresignedPathsForFiles: ExportedHttpEndpointWithMddocDefinition<GetPresignedPathsForFilesHttpEndpoint>;
  uploadFile: ExportedHttpEndpointWithMddocDefinition<UploadFileHttpEndpoint>;
};

export type FileMatcherPathParameters = {
  filepath?: string;
};
