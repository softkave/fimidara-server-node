import {Readable} from 'stream';
import {noopAsync} from '../../../utilities/fns';
import {
  IFilePersistenceUploadFileParams,
  IFilePersistenceGetFileParams,
  IFilePersistenceDeleteFilesParams,
} from '../../contexts/FilePersistenceProviderContext';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestMemoryFilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  public files: Record<string, IFilePersistenceUploadFileParams> = {};

  public uploadFile = jest
    .fn(async (params: IFilePersistenceUploadFileParams) => {
      this.files[params.bucket + '-' + params.key] = params;
    })
    .mockName('uploadFile');

  public getFile = jest
    .fn(async (params: IFilePersistenceGetFileParams) => {
      const file = this.files[params.bucket + '-' + params.key];

      if (file) {
        const readable = new Readable();
        readable.push(file.body);
        readable.push(null);
        return {body: readable};
      }

      return {body: undefined};
    })
    .mockName('getFile');

  public deleteFiles = jest
    .fn(async (params: IFilePersistenceDeleteFilesParams) => {
      params.keys.forEach(key => {
        delete this.files[params.bucket + '-' + key];
      });
    })
    .mockName('deleteFiles');

  public ensureBucketReady = jest.fn(noopAsync);
  public close = jest.fn(noopAsync);
}
