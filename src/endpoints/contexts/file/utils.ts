import {isObject} from 'lodash';
import {FileBackendMount, kFileBackendType} from '../../../definitions/fileBackend';
import {FimidaraFilePersistenceProvider} from './FimidaraFilePersistenceProvider';
import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from './S3FilePersistenceProvider';
import {FilePersistenceProvider, FileProviderResolver} from './types';

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

export const defaultFileProviderResolver: FileProviderResolver = (
  mount: FileBackendMount,
  initParams: unknown
) => {
  switch (mount.backend) {
    case kFileBackendType.Fimidara:
      return new FimidaraFilePersistenceProvider();
    case kFileBackendType.S3:
      return new S3FilePersistenceProvider(
        initParams as S3FilePersistenceProviderInitParams
      );
  }
};
