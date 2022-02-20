import {S3FilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestS3FilePersistenceProviderContext
  extends S3FilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext {
  public uploadFile = jest
    .fn(S3FilePersistenceProviderContext.prototype.uploadFile)
    .mockName('uploadFile');

  public getFile = jest
    .fn(S3FilePersistenceProviderContext.prototype.getFile)
    .mockName('getFile');

  public deleteFiles = jest
    .fn(S3FilePersistenceProviderContext.prototype.deleteFiles)
    .mockName('deleteFiles');

  public ensureBucketReady = jest
    .fn(S3FilePersistenceProviderContext.prototype.ensureBucketReady)
    .mockName('ensureBucketReady');

  public async cleanupBucket(name: string) {
    await this.s3
      .deleteBucket({
        Bucket: name,
      })
      .promise();
  }
}
