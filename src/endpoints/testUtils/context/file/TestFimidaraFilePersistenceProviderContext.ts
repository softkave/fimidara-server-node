import {vi} from 'vitest';
import {FimidaraFilePersistenceProvider} from '../../../../contexts/file/FimidaraFilePersistenceProvider.js';
import {mockWith} from '../../helpers/mock.js';
import {TestFilePersistenceProviderContext} from '../types.js';

export default class TestFimidaraFilePersistenceProviderContext
  implements TestFilePersistenceProviderContext
{
  private client: FimidaraFilePersistenceProvider;

  uploadFile: TestFilePersistenceProviderContext['uploadFile'];
  completeMultipartUpload: TestFilePersistenceProviderContext['completeMultipartUpload'];
  cleanupMultipartUpload: TestFilePersistenceProviderContext['cleanupMultipartUpload'];
  toFimidaraPath: TestFilePersistenceProviderContext['toFimidaraPath'];
  toNativePath: TestFilePersistenceProviderContext['toNativePath'];
  readFile: TestFilePersistenceProviderContext['readFile'];
  deleteFiles: TestFilePersistenceProviderContext['deleteFiles'];
  deleteFolders: TestFilePersistenceProviderContext['deleteFolders'];
  describeFile: TestFilePersistenceProviderContext['describeFile'];
  describeFolder: TestFilePersistenceProviderContext['describeFolder'];
  describeFolderContent: TestFilePersistenceProviderContext['describeFolderContent'];
  supportsFeature: TestFilePersistenceProviderContext['supportsFeature'];
  dispose: TestFilePersistenceProviderContext['dispose'];

  constructor() {
    this.client = new FimidaraFilePersistenceProvider();
    this.uploadFile = vi.fn(this.client.uploadFile).mockName('uploadFile');
    this.completeMultipartUpload = vi
      .fn(this.client.completeMultipartUpload)
      .mockName('completeMultipartUpload');
    this.cleanupMultipartUpload = vi
      .fn(this.client.cleanupMultipartUpload)
      .mockName('cleanupMultipartUpload');
    this.toFimidaraPath = vi
      .fn(this.client.toFimidaraPath)
      .mockName('toFimidaraPath');
    this.toNativePath = vi
      .fn(this.client.toNativePath)
      .mockName('toNativePath');
    this.readFile = vi.fn(this.client.readFile).mockName('getFile');
    this.deleteFiles = vi.fn(this.client.deleteFiles).mockName('deleteFiles');
    this.deleteFolders = vi
      .fn(this.client.deleteFolders)
      .mockName('deleteFolders');
    this.describeFile = vi
      .fn(this.client.describeFile)
      .mockName('describeFile');
    this.describeFolder = vi
      .fn(this.client.describeFolder)
      .mockName('describeFolder');
    this.describeFolderContent = vi
      .fn(this.client.describeFolderContent)
      .mockName('describeFolderContent');
    this.dispose = vi.fn(this.client.dispose).mockName('close');
    this.supportsFeature = vi
      .fn(this.client.supportsFeature)
      .mockName('supportsFeature');

    mockWith(this.client, this);
  }
}
