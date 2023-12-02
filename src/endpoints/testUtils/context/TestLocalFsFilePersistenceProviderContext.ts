import LocalFsFilePersistenceProvider from '../../contexts/file/LocalFsFilePersistenceProvider';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestLocalFsFilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: LocalFsFilePersistenceProvider;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  readFile: ITestFilePersistenceProviderContext['readFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  ensureBucketReady: ITestFilePersistenceProviderContext['ensureBucketReady'];
  close: ITestFilePersistenceProviderContext['close'];

  constructor(private fileDir: string) {
    this.client = new LocalFsFilePersistenceProvider(this.fileDir);
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.readFile = jest.fn(this.client.readFile).mockName('getFile');
    this.deleteFiles = jest.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.ensureBucketReady = jest
      .fn(this.client.ensureBucketReady)
      .mockName('ensureBucketReady');
    this.close = jest.fn(this.client.close).mockName('close');
  }
}
