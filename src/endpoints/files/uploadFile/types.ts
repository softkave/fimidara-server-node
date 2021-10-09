import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFile} from '../types';

export interface INewFileInput {
  name: string;
  description?: string;
  organizationId: string;
  environmentId: string;
  folderId?: string;
  mimetype: string;
  size: number;
  encoding: string;
  file: Buffer;
  meta?: Record<string, string | number | boolean | null>;
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
