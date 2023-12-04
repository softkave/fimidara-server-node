import {FileBackendType} from '../../../definitions/fileBackend';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {FimidaraFilePersistenceProvider} from './FimidaraFilePersistenceProvider';
import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from './S3FilePersistenceProvider';
import {FilePersistenceProvider} from './types';

export function resolveFilePersistenceProvider(
  type: FileBackendType,
  initParams: unknown
): FilePersistenceProvider {
  if (type === 'fimidara') {
    return new FimidaraFilePersistenceProvider();
  } else if (type === 'aws-s3') {
    return new S3FilePersistenceProvider(
      initParams as S3FilePersistenceProviderInitParams
    );
  }

  throw kReuseableErrors.file.unknownBackend(type);
}
