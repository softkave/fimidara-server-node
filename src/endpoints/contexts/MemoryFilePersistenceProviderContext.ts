import {Readable} from 'stream';
import {noopAsync} from '../../utilities/fns';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import {
  IFilePersistenceDeleteFilesParams,
  IFilePersistenceGetFileParams,
  IFilePersistenceProviderContext,
  IFilePersistenceUploadFileParams,
} from './FilePersistenceProviderContext';

export default class MemoryFilePersistenceProviderContext
  implements IFilePersistenceProviderContext
{
  public files: Record<string, IFilePersistenceUploadFileParams> = {};

  public uploadFile = wrapFireAndThrowError(
    async (params: IFilePersistenceUploadFileParams) => {
      this.files[params.bucket + '-' + params.key] = params;
    }
  );

  public getFile = wrapFireAndThrowError(
    async (params: IFilePersistenceGetFileParams) => {
      const file = this.files[params.bucket + '-' + params.key];

      if (file) {
        const readable = new Readable();
        readable.push(file.body);
        readable.push(null);
        return {body: readable};
      }

      return {body: undefined};
    }
  );

  public deleteFiles = wrapFireAndThrowError(
    async (params: IFilePersistenceDeleteFilesParams) => {
      params.keys.forEach(key => {
        delete this.files[params.bucket + '-' + key];
      });
    }
  );

  public ensureBucketReady = noopAsync;
  public close = noopAsync;
}
