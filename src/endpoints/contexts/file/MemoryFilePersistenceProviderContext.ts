import {Readable} from 'stream';
import {noopAsync} from '../../../utils/fns';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceGetFileParams,
  FilePersistenceProviderContext,
  FilePersistenceUploadFileParams,
  IPersistedFile,
} from './types';

export default class MemoryFilePersistenceProviderContext
  implements FilePersistenceProviderContext
{
  files: Record<string, FilePersistenceUploadFileParams> = {};

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    this.files[params.bucket + '-' + params.key] = params;
  };

  getFile = async (params: FilePersistenceGetFileParams): Promise<IPersistedFile> => {
    const file = this.files[params.bucket + '-' + params.key];

    if (file) {
      const readable = new Readable();
      readable.push(file.body);
      readable.push(null);
      return {body: readable, contentLength: file.contentLength};
    }

    return {body: undefined};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    params.keys.forEach(key => {
      delete this.files[params.bucket + '-' + key];
    });
  };

  ensureBucketReady = noopAsync;
  close = noopAsync;
}
