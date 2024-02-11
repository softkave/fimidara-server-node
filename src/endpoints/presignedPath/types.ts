import {FieldBinaryType} from '../../mddoc/mddoc';
import {EmptyObject} from '../../utils/types';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpointRequestHeaders_AuthOptional,
  HttpEndpointRequestHeaders_AuthOptional_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {DeleteFileEndpoint} from './deleteFile/types';
import {GetFileDetailsEndpoint} from './getFileDetails/types';
import {GetPresignedPathsForFilesEndpoint} from './getPresignedPaths/types';
import {IssuePresignedPathEndpoint} from './issuePresignedPath/types';
import {
  ReadFileEndpoint,
  ReadFileEndpointHttpQuery,
  ReadFileEndpointParams,
} from './readFile/types';
import {UpdateFileDetailsEndpoint} from './updateFileDetails/types';
import {
  UploadFileEndpoint,
  UploadFileEndpointParams,
  UploadFileEndpointResult,
} from './uploadFile/types';

export type UploadFileEndpointHTTPHeaders =
  HttpEndpointRequestHeaders_AuthOptional_ContentType & {
    'content-encoding'?: string;
    'x-fimidara-file-description'?: string;
    'x-fimidara-file-mimetype'?: string;
    'content-length': number;
  };

export type ReadFilePOSTHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ ReadFileEndpoint,
  /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional_ContentType,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ ReadFileEndpointHttpQuery,
  /** TRequestBody */ ReadFileEndpointParams,
  /** TResponseHeaders */ HttpEndpointResponseHeaders_ContentType_ContentLength,
  /** TResponseBody */ FieldBinaryType,
  /** TSdkparams */ ReadFileEndpointParams
>;
export type ReadFileGETHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  /** TEndpoint */ ReadFileEndpoint,
  /** TRequestHeaders */ HttpEndpointRequestHeaders_AuthOptional,
  /** TPathParameters */ FileMatcherPathParameters,
  /** TQuery */ ReadFileEndpointHttpQuery,
  /** TRequestBody */ {},
  /** TResponseHeaders */ HttpEndpointResponseHeaders_ContentType_ContentLength,
  /** TResponseBody */ FieldBinaryType,
  /** TSdkparams */ ReadFileEndpointParams
>;
export type DeleteFileHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeleteFileEndpoint>;
export type GetFileDetailsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetFileDetailsEndpoint>;
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
export type IssuePresignedPathHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<IssuePresignedPathEndpoint>;
export type GetPresignedPathsForFilesHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetPresignedPathsForFilesEndpoint>;

export type FilesExportedEndpoints = {
  readFile: [ReadFilePOSTHttpEndpoint, ReadFileGETHttpEndpoint];
  deleteFile: DeleteFileHttpEndpoint;
  getFileDetails: GetFileDetailsHttpEndpoint;
  updateFileDetails: UpdateFileDetailsHttpEndpoint;
  issuePresignedPath: IssuePresignedPathHttpEndpoint;
  getPresignedPathsForFiles: GetPresignedPathsForFilesHttpEndpoint;
  uploadFile: UploadFileHttpEndpoint;
};

export type FileMatcherPathParameters = {
  filepathOrId?: string;
};
