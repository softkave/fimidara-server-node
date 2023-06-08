import {FileMatcher, PublicFile} from '../../../definitions/file';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export enum UploadFilePublicAccessActions {
  None = 'none',
  Read = 'read',
  ReadAndUpdate = 'read-update',
  ReadUpdateAndDelete = 'read-update-delete',
}

export interface UploadFileEndpointParams extends FileMatcher {
  description?: string;
  encoding?: string;
  extension?: string;
  mimetype?: string; // TODO: define mimetypes
  data: Buffer;
}

export interface UploadFileEndpointResult {
  file: PublicFile;
}

export type UploadFileEndpoint = Endpoint<
  BaseContextType,
  UploadFileEndpointParams,
  UploadFileEndpointResult
>;
