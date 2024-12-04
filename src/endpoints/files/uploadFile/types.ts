import {Readable} from 'stream';
import {FileMatcher, PublicFile} from '../../../definitions/file.js';
import {Endpoint} from '../../types.js';

export interface UploadFileEndpointParams extends FileMatcher {
  description?: string;
  mimetype?: string; // TODO: define mimetypes
  encoding?: string;
  data: Readable;
  size: number;
  /** 0-based part number */
  part?: number;
  isLastPart?: boolean;
  clientMultipartId?: string;
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;
