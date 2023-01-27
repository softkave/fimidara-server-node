import {Readable} from 'stream';
import {noopAsync} from '../../utils/fns';
import {
  IFilePersistenceDeleteFilesParams,
  IFilePersistenceGetFileParams,
  IFilePersistenceProviderContext,
  IFilePersistenceUploadFileParams,
  IPersistedFile,
} from './FilePersistenceProviderContext';

export default class MemoryFilePersistenceProviderContext
  implements IFilePersistenceProviderContext
{
  files: Record<string, IFilePersistenceUploadFileParams> = {};

  uploadFile = async (params: IFilePersistenceUploadFileParams) => {
    this.files[params.bucket + '-' + params.key] = params;
  };

  getFile = async (
    params: IFilePersistenceGetFileParams
  ): Promise<IPersistedFile> => {
    const file = this.files[params.bucket + '-' + params.key];
    if (file) {
      const readable = new Readable();
      readable.push(file.body);
      readable.push(null);
      return {
        body: readable,
        contentLength: file.contentLength || file.body.byteLength,
      };
    }

    return {body: undefined};
  };

  deleteFiles = async (params: IFilePersistenceDeleteFilesParams) => {
    params.keys.forEach(key => {
      delete this.files[params.bucket + '-' + key];
    });
  };

  ensureBucketReady = noopAsync;
  close = noopAsync;
}
