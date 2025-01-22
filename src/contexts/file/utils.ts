import {isObject} from 'lodash-es';
import {
  FileBackendMount,
  kFileBackendType,
} from '../../definitions/fileBackend.js';
import {pathJoin, pathSplit} from '../../utils/fns.js';
import {FimidaraFilePersistenceProvider} from './FimidaraFilePersistenceProvider.js';
import {
  S3FilePersistenceProvider,
  S3FilePersistenceProviderInitParams,
} from './S3FilePersistenceProvider.js';
import {
  FilePersistenceProvider,
  FileProviderResolver,
  IFilePersistenceProviderMount,
} from './types.js';

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
  mount: IFilePersistenceProviderMount,
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
  mount: Pick<FileBackendMount, 'mountedFrom' | 'namepath'>,
  fimidaraPath: string,
  preMountedFromPrefix: string | string[] = [],
  postMountedFromPrefix: string | string[] = []
) {
  return pathJoin(
    preMountedFromPrefix,
    mount.mountedFrom,
    postMountedFromPrefix,
    pathSplit(fimidaraPath).slice(mount.namepath.length)
  );
}

export function defaultToFimidaraPath(
  mount: Pick<FileBackendMount, 'mountedFrom' | 'namepath'>,
  nativePath: string,
  preMountedFromPrefix: string | string[] = [],
  postMountedFromPrefix: string | string[] = []
) {
  const nativePathSplit = pathSplit(nativePath);
  const preMountedFromPrefixSplit = pathSplit(preMountedFromPrefix);
  const postMountedFromPrefixSplit = pathSplit(postMountedFromPrefix);
  const sliceFrom =
    preMountedFromPrefixSplit.length +
    mount.mountedFrom.length +
    postMountedFromPrefixSplit.length;
  const fPath = pathJoin(mount.namepath, nativePathSplit.slice(sliceFrom));
  return fPath;
}
