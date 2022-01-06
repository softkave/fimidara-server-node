import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFile} from '../types';

export interface INewFileInput {
  description?: string;
  mimetype: string; // TODO: define mimetypes
  encoding?: string;
  data: Buffer;
  path: string;
}

export interface IUploadFileParams {
  organizationId?: string;
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
