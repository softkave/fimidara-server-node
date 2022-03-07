import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicFile} from '../types';

// export interface INewFileInput {
//   description?: string;
//   encoding?: string;
//   extension?: string;
//   mimetype: string; // TODO: define mimetypes
//   data: Buffer;
//   path: string;
// }

export interface IUploadFileParams {
  organizationId?: string;
  // file: INewFileInput;
  description?: string;
  encoding?: string;
  extension?: string;
  mimetype?: string; // TODO: define mimetypes
  isPublic?: boolean;
  data: Buffer;
  path: string;
}

export interface IUploadFileResult {
  file: IPublicFile;
}

export type UploadFileEndpoint = Endpoint<
  IBaseContext,
  IUploadFileParams,
  IUploadFileResult
>;
