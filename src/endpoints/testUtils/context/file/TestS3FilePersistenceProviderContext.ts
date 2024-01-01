import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from '../../../contexts/file/S3FilePersistenceProvider';
import {ITestFilePersistenceProviderContext} from '../types';

export default class TestS3FilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: S3FilePersistenceProvider;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  readFile: ITestFilePersistenceProviderContext['readFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  deleteFolders: ITestFilePersistenceProviderContext['deleteFolders'];
  describeFile: ITestFilePersistenceProviderContext['describeFile'];
  describeFolder: ITestFilePersistenceProviderContext['describeFolder'];
  describeFolderFiles: ITestFilePersistenceProviderContext['describeFolderFiles'];
  describeFolderFolders: ITestFilePersistenceProviderContext['describeFolderFolders'];
  supportsFeature: ITestFilePersistenceProviderContext['supportsFeature'];
  dispose: ITestFilePersistenceProviderContext['dispose'];

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.client = new S3FilePersistenceProvider(params);
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.readFile = jest.fn(this.client.readFile).mockName('getFile');
    this.deleteFiles = jest.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.deleteFolders = jest.fn(this.client.deleteFolders).mockName('deleteFolders');
    this.describeFile = jest.fn(this.client.describeFile).mockName('describeFile');
    this.describeFolder = jest.fn(this.client.describeFolder).mockName('describeFolder');
    this.describeFolderFiles = jest
      .fn(this.client.describeFolderFiles)
      .mockName('describeFolderFiles');
    this.describeFolderFolders = jest
      .fn(this.client.describeFolderFolders)
      .mockName('describeFolderFolders');
    this.dispose = jest.fn(this.client.dispose).mockName('dispose');
    this.supportsFeature = jest
      .fn(this.client.supportsFeature)
      .mockName('supportsFeature');
  }
}
