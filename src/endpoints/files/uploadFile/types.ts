import {Readable} from 'stream';
import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export interface UploadFileEndpointParams extends FileMatcher {
  data: Readable;
  description?: string;
  encoding?: string;
  mimetype?: string; // TODO: define mimetypes
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;
