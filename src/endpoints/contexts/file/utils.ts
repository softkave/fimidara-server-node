import {isObject} from 'lodash';
import {FileBackendType} from '../../../definitions/fileBackend';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {FimidaraFilePersistenceProvider} from './FimidaraFilePersistenceProvider';
import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from './S3FilePersistenceProvider';
import {FilePersistenceProvider, FileProviderResolver} from './types';

export const resolveFilePersistenceProvider: FileProviderResolver = (
  type: FileBackendType,
  initParams: unknown
): FilePersistenceProvider => {
  if (type === 'fimidara') {
    return new FimidaraFilePersistenceProvider();
  } else if (type === 'aws-s3') {
    return new S3FilePersistenceProvider(
      initParams as S3FilePersistenceProviderInitParams
    );
  }

  throw kReuseableErrors.file.unknownBackend(type);
};

export function isFilePersistenceProvider(
  item: unknown
): item is FilePersistenceProvider {
  return (
    isObject(item) &&
    !!(item as FilePersistenceProvider).supportsFeature &&
    !!(item as FilePersistenceProvider).uploadFile &&
    !!(item as FilePersistenceProvider).readFile
  );
}
