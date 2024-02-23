import {Readable} from 'stream';
import {FileMatcher, PublicFile} from '../../../definitions/file';
import {Endpoint} from '../../types';

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
