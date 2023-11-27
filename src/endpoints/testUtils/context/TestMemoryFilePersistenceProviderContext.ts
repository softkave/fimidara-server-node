import MemoryFilePersistenceProvider from '../../contexts/file/MemoryFilePersistenceProvider';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestMemoryFilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: MemoryFilePersistenceProvider;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  getFile: ITestFilePersistenceProviderContext['getFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  ensureBucketReady: ITestFilePersistenceProviderContext['ensureBucketReady'];
  close: ITestFilePersistenceProviderContext['close'];

  constructor() {
    this.client = new MemoryFilePersistenceProvider();
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.getFile = jest.fn(this.client.getFile).mockName('getFile');
    this.deleteFiles = jest.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.ensureBucketReady = jest
      .fn(this.client.ensureBucketReady)
      .mockName('ensureBucketReady');
    this.close = jest.fn(this.client.close).mockName('close');
  }
}
