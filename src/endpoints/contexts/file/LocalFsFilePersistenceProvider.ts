import fse from 'fs-extra';
import {compact, first, isNumber} from 'lodash';
import {appAssert} from '../../../utils/assertion';
import {noopAsync, pathJoin} from '../../../utils/fns';
import {AnyFn} from '../../../utils/types';
import {kUtilsInjectables} from '../injection/injectables';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FilePersistenceUploadFileResult,
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
  protected dirNamepath: string;

  constructor(private params: LocalFsFilePersistenceProviderParams) {
    fse.ensureDirSync(params.dir);
    this.dirNamepath = params.dir;
  }

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
      case 'deleteFolders':
      case 'describeFile':
      case 'describeFolder':
      case 'describeFolderContent':
      case 'readFile':
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    await fse.ensureFile(nativePath);

    return new Promise<FilePersistenceUploadFileResult>((resolve, reject) => {
      const writeStream = fse.createWriteStream(nativePath, {
        autoClose: true,
        emitClose: true,
      });
      writeStream.on('close', () => {
        resolve({filepath, raw: undefined});
      });
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
    if (params.files.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    const rmPromises = params.files.map(async ({filepath: key}) => {
      const {nativePath} = this.toNativePath({fimidaraPath: key, mount: params.mount});
      await fse.promises.rm(nativePath, {force: true});
    });

    await Promise.all(rmPromises);
  };

  deleteFolders = async (params: FilePersistenceDeleteFoldersParams) => {
    if (params.folders.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    const rmPromises = params.folders.map(async ({folderpath: key}) => {
      const {nativePath} = this.toNativePath({fimidaraPath: key, mount: params.mount});
      await fse.promises.rm(nativePath, {recursive: true, force: true});
    });

    await Promise.all(rmPromises);
  };

  describeFile = async (
    params: FilePersistenceDescribeFileParams
  ): Promise<PersistedFileDescription<undefined> | undefined> => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    return first(
      await this.getLocalStats(
        [nativePath],
        (stat): PersistedFileDescription<undefined> | undefined => {
          if (stat.isFile()) {
            return {
              filepath,
              size: stat.size,
              lastUpdatedAt: stat.mtimeMs,
              mountId: mount.resourceId,
              raw: undefined,
            };
          }

          return undefined;
        }
      )
    );
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription<undefined> | undefined> => {
    const {mount, folderpath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: folderpath, mount: mount});
    return first(
      await this.getLocalStats(
        [nativePath],
        (stat): PersistedFolderDescription<undefined> | undefined => {
          if (stat.isDirectory()) {
            return {
              folderpath: params.folderpath,
              mountId: params.mount.resourceId,
              raw: undefined,
            };
          }

          return undefined;
        }
      )
    );
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<FilePersistenceDescribeFolderContentResult<undefined, undefined>> => {
    const {mount, max} = params;
    const files: PersistedFileDescription<undefined>[] = [];
    const folders: PersistedFolderDescription<undefined>[] = [];
    const {continuationToken} = await this.produceFromChildren(
      params,
      (stat, nativePath) => {
        if (stat.isFile()) {
          files.push({
            filepath: this.toFimidaraPath({nativePath, mount}).fimidaraPath,
            size: stat.size,
            lastUpdatedAt: stat.mtimeMs,
            mountId: mount.resourceId,
            raw: undefined,
          });
        } else if (stat.isDirectory()) {
          folders.push({
            folderpath: this.toFimidaraPath({nativePath, mount}).fimidaraPath,
            mountId: mount.resourceId,
            raw: undefined,
          });
        }

        return files.length + folders.length >= max;
      }
    );

    return {continuationToken, files, folders};
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
    TFn extends AnyFn<
      [fse.Stats, string, number],
      /** stop if `true`, continue if `false` or `undefined` */ boolean
    >,
  >(
    params: FilePersistenceDescribeFolderFoldersParams,
    fn: TFn
  ): Promise<{continuationToken?: number}> => {
    const {mount, folderpath, continuationToken, max} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: folderpath, mount: mount});

    if (continuationToken) {
      appAssert(isNumber(continuationToken));
    }

    try {
      // TODO: possible issue where folder children out use RAM. It's a string,
      // but there can be a lot.
      const children = await fse.promises.readdir(nativePath);
      let pageIndex = (continuationToken as number | undefined) || 0;
      let stopIndex = pageIndex;
      let stopSignal = false;

      for (; pageIndex < children.length && !stopSignal; pageIndex = pageIndex + max) {
        await this.getLocalStats(
          children.slice(pageIndex, pageIndex + max).map(p => pathJoin(nativePath, p)),
          (stat, nativePath, statIndex) => {
            stopSignal = fn(stat, nativePath, statIndex);
            stopIndex = pageIndex + statIndex + 1;
          }
        );
      }

      const nextContinuationToken =
        stopIndex < children.length - 1 ? stopIndex : undefined;
      return {continuationToken: nextContinuationToken};
    } catch (error) {
      kUtilsInjectables.logger().error(error);
      return {};
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
          kUtilsInjectables.logger().error(error);
          return undefined;
        }
      })
    );

    return compact(items);
  }
}
