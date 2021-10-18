import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFile} from '../types';

// TODO: should we able to move files accross buckets and environments
export interface INewFileInput {
  name: string;
  description?: string;
  environmentId: string;
  bucketId: string;
  folderId?: string;
  folderPath?: string;
  mimetype: string;
  encoding: string;
  // meta?: Record<string, string | number | boolean | null>;
}

export interface IUploadFileParams {
  file: INewFileInput;
}

export interface IUploadFileResult {
  file: IPublicFile;
}

export type UploadFileEndpoint = Endpoint<
  IBaseContext,
  IUploadFileParams,
  IUploadFileResult
>;
