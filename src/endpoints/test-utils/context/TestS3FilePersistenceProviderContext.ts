import {S3FilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestS3FilePersistenceProviderContext
  extends S3FilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext {
  public uploadFile = jest.fn(
    S3FilePersistenceProviderContext.prototype.uploadFile
  );

  public getFile = jest.fn(S3FilePersistenceProviderContext.prototype.getFile);
  public deleteFiles = jest.fn(
    S3FilePersistenceProviderContext.prototype.deleteFiles
  );
}
