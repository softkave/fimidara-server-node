import {IFileMatcher, IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export enum UploadFilePublicAccessActions {
  None = 'none',
  Read = 'read',
  ReadAndUpdate = 'read-update',
  ReadUpdateAndDelete = 'read-update-delete',
}

export interface IUploadFileEndpointParams extends IFileMatcher {
  description?: string;
  encoding?: string;
  extension?: string;
  mimetype?: string; // TODO: define mimetypes
  data: Buffer;
  publicAccessActions?: UploadFilePublicAccessActions;
}

export interface IUploadFileEndpointResult {
  file: IPublicFile;
}

export type UploadFileEndpoint = Endpoint<
  IBaseContext,
  IUploadFileEndpointParams,
  IUploadFileEndpointResult
>;
