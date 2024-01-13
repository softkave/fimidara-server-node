import {FimidaraFilePersistenceProvider} from '../../../contexts/file/FimidaraFilePersistenceProvider';
import {ITestFilePersistenceProviderContext} from '../types';

export default class TestFimidaraFilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext
{
  private client: FimidaraFilePersistenceProvider;

  uploadFile: ITestFilePersistenceProviderContext['uploadFile'];
  toFimidaraPath: ITestFilePersistenceProviderContext['toFimidaraPath'];
  toNativePath: ITestFilePersistenceProviderContext['toNativePath'];
  readFile: ITestFilePersistenceProviderContext['readFile'];
  deleteFiles: ITestFilePersistenceProviderContext['deleteFiles'];
  deleteFolders: ITestFilePersistenceProviderContext['deleteFolders'];
  describeFile: ITestFilePersistenceProviderContext['describeFile'];
  describeFolder: ITestFilePersistenceProviderContext['describeFolder'];
  describeFolderFiles: ITestFilePersistenceProviderContext['describeFolderFiles'];
  describeFolderFolders: ITestFilePersistenceProviderContext['describeFolderFolders'];
  supportsFeature: ITestFilePersistenceProviderContext['supportsFeature'];
  dispose: ITestFilePersistenceProviderContext['dispose'];

  constructor() {
    this.client = new FimidaraFilePersistenceProvider();
    this.uploadFile = jest.fn(this.client.uploadFile).mockName('uploadFile');
    this.toFimidaraPath = jest.fn(this.client.toFimidaraPath).mockName('toFimidaraPath');
    this.toNativePath = jest.fn(this.client.toNativePath).mockName('toNativePath');
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
    this.dispose = jest.fn(this.client.dispose).mockName('close');
    this.supportsFeature = jest
      .fn(this.client.supportsFeature)
      .mockName('supportsFeature');
  }
}
