import {IPublicFile} from '../../../definitions/file';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export enum UploadFilePublicAccessActions {
  None = 'none',
  Read = 'read',
  ReadAndUpdate = 'read-update',
  ReadUpdateAndDelete = 'read-update-delete',
}

export interface IUploadFileParams {
  organizationId?: string;
  description?: string;
  encoding?: string;
  extension?: string;
  mimetype?: string; // TODO: define mimetypes
  data: Buffer;
  path: string;
  publicAccessActions?: UploadFilePublicAccessActions;
  // inheritParentPublicAccessOps?: boolean;
}

export interface IUploadFileResult {
  file: IPublicFile;
}

export type UploadFileEndpoint = Endpoint<
  IBaseContext,
  IUploadFileParams,
  IUploadFileResult
>;
