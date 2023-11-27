import {Readable} from 'stream';
import {noopAsync, streamToBuffer} from '../../../utils/fns';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
  PersistedFile,
} from './types';

export default class MemoryFilePersistenceProvider implements FilePersistenceProvider {
  files: Record<string, Omit<FilePersistenceUploadFileParams, 'body'> & {body: Buffer}> =
    {};

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    this.files[params.bucket + '-' + params.key] = {
      key: params.key,
      bucket: params.bucket,
      // contentLength: params.contentLength,
      body: await streamToBuffer(params.body),
    };
  };

  getFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const file = this.files[params.bucket + '-' + params.key];

    if (file) {
      return {
        body: Readable.from(file.body),
        // contentLength: file.contentLength
        contentLength: undefined,
      };
    }

    return {body: undefined};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    params.keys.forEach(key => {
      delete this.files[params.bucket + '-' + key];
    });
  };

  close = noopAsync;
}
