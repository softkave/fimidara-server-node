import {ExportedHttpEndpoint} from '../types';
import {DeleteFileEndpoint} from './deleteFile/types';
import {GetFileDetailsEndpoint} from './getFileDetails/types';
import {ReadFileEndpoint} from './readFile/types';
import {UpdateFileDetailsEndpoint} from './updateFileDetails/types';
import {UploadFileEndpoint} from './uploadFile/types';

export type FilesExportedEndpoints = {
  readFile: ExportedHttpEndpoint<ReadFileEndpoint>;
  deleteFile: ExportedHttpEndpoint<DeleteFileEndpoint>;
  getFileDetails: ExportedHttpEndpoint<GetFileDetailsEndpoint>;
  updateFileDetails: ExportedHttpEndpoint<UpdateFileDetailsEndpoint>;
  uploadFile: ExportedHttpEndpoint<UploadFileEndpoint>;
};

export type FileMatcherPathParameters = {
  filepath?: string;
};
