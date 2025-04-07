import {vi} from 'vitest';
import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from '../../../../contexts/file/S3FilePersistenceProvider.js';
import {mockWith} from '../../helpers/mock.js';
import {LayerJestMock, TestFilePersistenceProviderContext} from '../types.js';

export type TestS3FilePersistenceProviderContextType =
  LayerJestMock<S3FilePersistenceProvider>;

export default class TestS3FilePersistenceProviderContext
  implements TestFilePersistenceProviderContext
{
  private client: S3FilePersistenceProvider;

  uploadFile: TestS3FilePersistenceProviderContextType['uploadFile'];
  startMultipartUpload: TestS3FilePersistenceProviderContextType['startMultipartUpload'];
  completeMultipartUpload: TestFilePersistenceProviderContext['completeMultipartUpload'];
  cleanupMultipartUpload: TestFilePersistenceProviderContext['cleanupMultipartUpload'];
  deleteMultipartUploadPart: TestFilePersistenceProviderContext['deleteMultipartUploadPart'];
  toFimidaraPath: TestS3FilePersistenceProviderContextType['toFimidaraPath'];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  toNativePath: TestS3FilePersistenceProviderContextType['toNativePath'];
  readFile: TestS3FilePersistenceProviderContextType['readFile'];
  deleteFiles: TestS3FilePersistenceProviderContextType['deleteFiles'];
  deleteFolders: TestS3FilePersistenceProviderContextType['deleteFolders'];
  describeFile: TestS3FilePersistenceProviderContextType['describeFile'];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  describeFolder: TestS3FilePersistenceProviderContextType['describeFolder'];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  describeFolderContent: TestS3FilePersistenceProviderContextType['describeFolderContent'];
  supportsFeature: TestS3FilePersistenceProviderContextType['supportsFeature'];
  dispose: TestS3FilePersistenceProviderContextType['dispose'];

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.client = new S3FilePersistenceProvider(params);
    this.uploadFile = vi.fn(this.client.uploadFile).mockName('uploadFile');
    this.cleanupMultipartUpload = vi
      .fn(this.client.cleanupMultipartUpload)
      .mockName('.cleanupMultipartUpload');
    this.completeMultipartUpload = vi
      .fn(this.client.completeMultipartUpload)
      .mockName('.completeMultipartUpload');
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
    this.dispose = vi.fn(this.client.dispose).mockName('dispose');
    this.supportsFeature = vi
      .fn(this.client.supportsFeature)
      .mockName('supportsFeature');
    this.startMultipartUpload = vi
      .fn(this.client.startMultipartUpload)
      .mockName('startMultipartUpload');
    this.deleteMultipartUploadPart = vi
      .fn(this.client.deleteMultipartUploadPart)
      .mockName('deleteMultipartUploadPart');

    mockWith(this.client, this);
  }
}
