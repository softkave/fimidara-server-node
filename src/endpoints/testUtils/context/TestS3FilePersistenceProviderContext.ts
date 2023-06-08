import {S3FilePersistenceProviderContext} from '../../contexts/file/S3FilePersistenceProviderContext';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestS3FilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: S3FilePersistenceProviderContext;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  getFile: ITestFilePersistenceProviderContext['getFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  ensureBucketReady: ITestFilePersistenceProviderContext['ensureBucketReady'];
  close: ITestFilePersistenceProviderContext['close'];

  constructor(region: string) {
    this.client = new S3FilePersistenceProviderContext(region);
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.getFile = jest.fn(this.client.getFile).mockName('getFile');
    this.deleteFiles = jest.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.ensureBucketReady = jest.fn(this.client.ensureBucketReady).mockName('ensureBucketReady');
    this.close = jest.fn(this.client.close).mockName('close');
  }
}
