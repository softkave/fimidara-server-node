import {Readable} from 'stream';
import {noopAsync} from '../../utilities/fns';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
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

  uploadFile = wrapFireAndThrowError(
    async (params: IFilePersistenceUploadFileParams) => {
      this.files[params.bucket + '-' + params.key] = params;
    }
  );

  getFile = wrapFireAndThrowError(
    async (params: IFilePersistenceGetFileParams): Promise<IPersistedFile> => {
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
    }
  );

  deleteFiles = wrapFireAndThrowError(
    async (params: IFilePersistenceDeleteFilesParams) => {
      params.keys.forEach(key => {
        delete this.files[params.bucket + '-' + key];
      });
    }
  );

  ensureBucketReady = noopAsync;
  close = noopAsync;
}
