import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from '../../../contexts/file/S3FilePersistenceProvider.js';
import {mockWith} from '../../helpers/mock.js';
import {ITestFilePersistenceProviderContext} from '../types.js';

export default class TestS3FilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: S3FilePersistenceProvider;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  toFimidaraPath: ITestFilePersistenceProviderContext['toFimidaraPath'];
  toNativePath: ITestFilePersistenceProviderContext['toNativePath'];
  readFile: ITestFilePersistenceProviderContext['readFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  deleteFolders: ITestFilePersistenceProviderContext['deleteFolders'];
  describeFile: ITestFilePersistenceProviderContext['describeFile'];
  describeFolder: ITestFilePersistenceProviderContext['describeFolder'];
  describeFolderContent: ITestFilePersistenceProviderContext['describeFolderContent'];
  supportsFeature: ITestFilePersistenceProviderContext['supportsFeature'];
  dispose: ITestFilePersistenceProviderContext['dispose'];

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.client = new S3FilePersistenceProvider(params);
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.toFimidaraPath = jest.fn(this.client.toFimidaraPath).mockName('toFimidaraPath');
    this.toNativePath = jest.fn(this.client.toNativePath).mockName('toNativePath');
    this.readFile = jest.fn(this.client.readFile).mockName('getFile');
    this.deleteFiles = jest.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.deleteFolders = jest.fn(this.client.deleteFolders).mockName('deleteFolders');
    this.describeFile = jest.fn(this.client.describeFile).mockName('describeFile');
    this.describeFolder = jest.fn(this.client.describeFolder).mockName('describeFolder');
    this.describeFolderContent = jest
      .fn(this.client.describeFolderContent)
      .mockName('describeFolderContent');
    this.dispose = jest.fn(this.client.dispose).mockName('dispose');
    this.supportsFeature = jest
      .fn(this.client.supportsFeature)
      .mockName('supportsFeature');

    mockWith(this.client, this);
  }
}
