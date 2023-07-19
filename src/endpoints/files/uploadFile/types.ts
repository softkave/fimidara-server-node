import {Readable} from 'stream';
import {FileMatcher, PublicFile} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface UploadFileEndpointParams extends FileMatcher {
  data: Readable;

  // TODO: can we validate that size matches stream length
  size: number;
  description?: string;
  encoding?: string;
  mimetype?: string; // TODO: define mimetypes
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  BaseContextType,
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;
