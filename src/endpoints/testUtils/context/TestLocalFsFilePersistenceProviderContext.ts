import LocalFsFilePersistenceProviderContext from '../../contexts/file/LocalFsFilePersistenceProviderContext';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestLocalFsFilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: LocalFsFilePersistenceProviderContext;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  getFile: ITestFilePersistenceProviderContext['getFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  ensureBucketReady: ITestFilePersistenceProviderContext['ensureBucketReady'];
  close: ITestFilePersistenceProviderContext['close'];

  constructor(private fileDir: string) {
    this.client = new LocalFsFilePersistenceProviderContext(this.fileDir);
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.getFile = jest.fn(this.client.getFile).mockName('getFile');
    this.deleteFiles = jest.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.ensureBucketReady = jest.fn(this.client.ensureBucketReady).mockName('ensureBucketReady');
    this.close = jest.fn(this.client.close).mockName('close');
  }
}
