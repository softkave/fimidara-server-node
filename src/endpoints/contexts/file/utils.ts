import {isObject} from 'lodash';
import {FileBackendMount, kFileBackendType} from '../../../definitions/fileBackend';
import {pathJoin, pathSplit} from '../../../utils/fns';
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
    case kFileBackendType.fimidara:
      return new FimidaraFilePersistenceProvider();
    case kFileBackendType.s3:
      return new S3FilePersistenceProvider(
        initParams as S3FilePersistenceProviderInitParams
      );
    default:
      throw new Error(`unknown backend type ${mount.backend}`);
  }
};

export function defaultToNativePath(
  mount: FileBackendMount,
  fimidaraPath: string,
  preMountedFromPrefix: string[] = [],
  postMountedFromPrefix: string[] = []
) {
  return pathJoin(
    preMountedFromPrefix,
    mount.mountedFrom,
    postMountedFromPrefix,
    pathSplit(fimidaraPath).slice(mount.namepath.length)
  );
}

export function defaultToFimidaraPath(
  mount: FileBackendMount,
  nativePath: string,
  preMountedFromPrefix: string[] = [],
  postMountedFromPrefix: string[] = []
) {
  return pathJoin(
    mount.namepath,
    pathSplit(nativePath).slice(
      preMountedFromPrefix.length +
        mount.mountedFrom.length +
        postMountedFromPrefix.length
    )
  );
}
