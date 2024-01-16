import fse from 'fs-extra';
import {compact, first, isNumber} from 'lodash';
import {appAssert} from '../../../utils/assertion';
import {noopAsync, pathJoin, pathSplit} from '../../../utils/fns';
import {AnyFn} from '../../../utils/types';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFilesResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderFoldersResult,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FimidaraToFilePersistencePathParams,
  FimidaraToFilePersistencePathResult,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types';
import {defaultToFimidaraPath, defaultToNativePath} from './utils';

export interface LocalFsFilePersistenceProviderParams {
  dir: string;
}

/**
 * - Does not use the `bucket` param, so it's okay passing an empty string for
 *   that
 */
export class LocalFsFilePersistenceProvider implements FilePersistenceProvider {
  protected dirNamepath: string[];

  constructor(private params: LocalFsFilePersistenceProviderParams) {
    fse.ensureDirSync(params.dir);
    this.dirNamepath = pathSplit(params.dir);
  }

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
      case 'deleteFolders':
      case 'describeFile':
      case 'describeFolder':
      case 'describeFolderFiles':
      case 'describeFolderFolders':
      case 'readFile':
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    await fse.ensureFile(nativePath);

    return new Promise<{}>((resolve, reject) => {
      const writeStream = fse.createWriteStream(nativePath, {
        autoClose: true,
        emitClose: true,
      });
      writeStream.on('close', () => resolve({}));
      writeStream.on('error', reject);
      params.body.pipe(writeStream);
    });
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    const stat = await fse.promises.stat(nativePath);

    if (!stat.isFile()) {
      return {body: undefined};
    }

    const stream = fse.createReadStream(nativePath, {autoClose: true});
    return {body: stream, size: stat.size};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    if (params.filepaths.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    const rmPromises = params.filepaths.map(async key => {
      const {nativePath} = this.toNativePath({fimidaraPath: key, mount: params.mount});
      await fse.promises.rm(nativePath, {force: true});
    });

    await Promise.all(rmPromises);
  };

  deleteFolders = async (params: FilePersistenceDeleteFoldersParams) => {
    if (params.folderpaths.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    const rmPromises = params.folderpaths.map(async key => {
      const {nativePath} = this.toNativePath({fimidaraPath: key, mount: params.mount});
      await fse.promises.rm(nativePath, {recursive: true, force: true});
    });

    await Promise.all(rmPromises);
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    return first(
      await this.getLocalStats(
        [nativePath],
        (stat): PersistedFileDescription | undefined => {
          if (stat.isFile()) {
            return {
              filepath,
              size: stat.size,
              lastUpdatedAt: stat.mtimeMs,
              mountId: mount.resourceId,
            };
          }

          return undefined;
        }
      )
    );
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    const {mount, folderpath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: folderpath, mount: mount});
    return first(
      await this.getLocalStats(
        [nativePath],
        (stat): PersistedFolderDescription | undefined => {
          if (stat.isDirectory()) {
            return {
              folderpath: params.folderpath,
              mountId: params.mount.resourceId,
            };
          }

          return undefined;
        }
      )
    );
  };

  describeFolderFiles = async (
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    const {mount} = params;
    const {items, continuationToken} = await this.produceFromChildren(
      params,
      (stat, nativePath) => {
        if (stat.isFile()) {
          const file: PersistedFileDescription = {
            filepath: this.toFimidaraPath({nativePath, mount}).fimidaraPath,
            size: stat.size,
            lastUpdatedAt: stat.mtimeMs,
            mountId: mount.resourceId,
          };
          return file;
        }

        return undefined;
      }
    );

    return {continuationToken, files: items};
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    const {mount} = params;
    const {items, continuationToken} = await this.produceFromChildren(
      params,
      (stat, nativePath): PersistedFolderDescription | undefined => {
        if (stat.isDirectory()) {
          return {
            folderpath: this.toFimidaraPath({nativePath, mount}).fimidaraPath,
            mountId: mount.resourceId,
          };
        }

        return undefined;
      }
    );

    return {continuationToken, folders: items};
  };

  dispose = noopAsync;

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    const {fimidaraPath, mount, postMountedFromPrefix} = params;
    const nativePath = defaultToNativePath(
      mount,
      fimidaraPath,
      this.dirNamepath,
      postMountedFromPrefix
    );
    return {nativePath};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount, postMountedFromPrefix} = params;
    const fimidaraPath = defaultToFimidaraPath(
      mount,
      nativePath,
      this.dirNamepath,
      postMountedFromPrefix
    );
    return {fimidaraPath};
  };

  protected produceFromChildren = async <
    TFn extends AnyFn<[fse.Stats, string, number]>,
    TResult = NonNullable<Awaited<ReturnType<TFn>>>,
  >(
    params: FilePersistenceDescribeFolderFoldersParams,
    fn: TFn
  ): Promise<{continuationToken?: number; items: TResult[]}> => {
    const {mount, folderpath, continuationToken, max} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: folderpath, mount: mount});

    if (continuationToken) {
      appAssert(isNumber(continuationToken));
    }

    try {
      // TODO: possible issue where folder children out use RAM. It's a string,
      // but there can be a lot.
      const children = await fse.promises.readdir(nativePath);
      const items: TResult[] = [];
      let pageIndex = (continuationToken as number | undefined) || 0;
      let stopIndex = pageIndex;

      for (
        ;
        pageIndex < children.length && items.length < max;
        pageIndex = pageIndex + max
      ) {
        await this.getLocalStats(
          children.slice(pageIndex, pageIndex + max).map(p => pathJoin(nativePath, p)),
          (stat, nativePath, statIndex) => {
            if (items.length < max) {
              const item = fn(stat, nativePath, statIndex);

              if (item) {
                items.push(item);
              }

              stopIndex = pageIndex + statIndex + 1;
            }
          }
        );
      }

      const nextContinuationToken =
        stopIndex < children.length - 1 ? stopIndex : undefined;
      return {items, continuationToken: nextContinuationToken};
    } catch (error) {
      console.error(error);
      return {items: []};
    }
  };

  protected async getLocalStats<T>(
    paths: string[],
    process: (stat: fse.Stats, path: string, index: number) => T | undefined
  ): Promise<T[]> {
    const items = await Promise.all(
      paths.map(async (nextPath, index) => {
        try {
          const stat = await fse.promises.stat(nextPath);
          return process(stat, nextPath, index);
        } catch (error) {
          console.error(error);
          return undefined;
        }
      })
    );

    return compact(items);
  }
}
