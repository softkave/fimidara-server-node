import {Readable} from 'stream';
import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UploadFileEndpointParams
  extends FileMatcher,
    EndpointOptionalWorkspaceIdParam {
  description?: string;
  mimetype?: string; // TODO: define mimetypes
  encoding?: string;
  data: Readable;
  size: number;
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;
