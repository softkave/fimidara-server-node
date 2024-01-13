import fse from 'fs-extra';
import {compact, first, isNumber} from 'lodash';
import path from 'path';
import {appAssert} from '../../../utils/assertion';
import {noopAsync} from '../../../utils/fns';
import {kFolderConstants} from '../../folders/constants';
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

export interface LocalFsFilePersistenceProviderParams {
  dir: string;
}

/**
 * - Does not use the `bucket` param, so it's okay passing an empty string for
 *   that
 */
export default class LocalFsFilePersistenceProvider implements FilePersistenceProvider {
  constructor(private params: LocalFsFilePersistenceProviderParams) {
    fse.ensureDirSync(params.dir);
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
    const {mount, folderpath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: folderpath, mount: mount});
    appAssert(isNumber(params.continuationToken));

    try {
      // TODO: possible issue where folder children out use RAM. It's a string,
      // but there can be a lot.
      const children = await fse.promises.readdir(nativePath);
      let files: PersistedFileDescription[] = [];
      let pageIndex = params.continuationToken;
      let stopIndex = pageIndex;

      for (
        ;
        pageIndex < children.length || files.length >= params.max;
        pageIndex = pageIndex + params.max
      ) {
        const pageFiles = await this.getLocalStats(
          children.slice(pageIndex, pageIndex + params.max),
          (stat, nativePath): PersistedFileDescription | undefined => {
            if (stat.isFile()) {
              return {
                filepath: this.toFimidaraPath({nativePath, mount}).fimidaraPath,
                size: stat.size,
                lastUpdatedAt: stat.mtimeMs,
                mountId: params.mount.resourceId,
              };
            }

            return undefined;
          }
        );

        const remaining = params.max - files.length;
        files = files.concat(pageFiles);

        if (remaining >= pageFiles.length) {
          files = files.concat(pageFiles);
          stopIndex += pageFiles.length;
        } else {
          files = files.concat(pageFiles.slice(0, remaining));
          stopIndex += remaining;
        }
      }

      return {files, continuationToken: stopIndex};
    } catch (error) {
      console.error(error);
      return {files: []};
    }
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    const {mount, folderpath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: folderpath, mount: mount});
    appAssert(isNumber(params.continuationToken));

    try {
      // TODO: possible issue where folder children out use RAM. It's a string,
      // but there can be a lot.
      const children = await fse.promises.readdir(nativePath);
      let folders: PersistedFolderDescription[] = [];
      let pageIndex = params.continuationToken;
      let stopIndex = pageIndex;

      for (
        ;
        pageIndex < children.length || folders.length >= params.max;
        pageIndex = pageIndex + params.max
      ) {
        const pageFolders = await this.getLocalStats(
          children.slice(pageIndex, pageIndex + params.max),
          (stat, path): PersistedFolderDescription | undefined => {
            if (stat.isDirectory()) {
              return {folderpath: path, mountId: params.mount.resourceId};
            }

            return undefined;
          }
        );

        const remaining = params.max - folders.length;
        folders = folders.concat(pageFolders);

        if (remaining >= pageFolders.length) {
          folders = folders.concat(pageFolders);
          stopIndex += pageFolders.length;
        } else {
          folders = folders.concat(pageFolders.slice(0, remaining));
          stopIndex += remaining;
        }
      }

      return {folders, continuationToken: stopIndex};
    } catch (error) {
      console.error(error);
      return {folders: []};
    }
  };

  dispose = noopAsync;

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    const {fimidaraPath, mount} = params;
    const nativePath = path.normalize(
      [this.params.dir]
        .concat(mount.mountedFrom, fimidaraPath)
        .join(kFolderConstants.separator)
    );
    return {nativePath};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount} = params;
    const prefix = path.normalize(
      [this.params.dir].concat(mount.mountedFrom).join(kFolderConstants.separator)
    );
    const fimidaraPath = nativePath.slice(prefix.length);
    return {fimidaraPath};
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
