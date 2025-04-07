import assert from 'assert';
import fse from 'fs-extra';
import {compact, first, isNumber} from 'lodash-es';
import path from 'path';
import {FimidaraSuppliedConfig} from '../../resources/config.js';
import {appAssert} from '../../utils/assertion.js';
import {noopAsync, pathJoin} from '../../utils/fns.js';
import {AnyFn} from '../../utils/types.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {
  FilePersistenceCleanupMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadResult,
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDeleteMultipartUploadPartParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceStartMultipartUploadParams,
  FilePersistenceStartMultipartUploadResult,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FilePersistenceUploadFileResult,
  FimidaraToFilePersistencePathParams,
  FimidaraToFilePersistencePathResult,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types.js';
import {defaultToFimidaraPath, defaultToNativePath} from './utils.js';

export interface LocalFsFilePersistenceProviderParams {
  dir: string;
  partsDir: string;
}

/**
 * - Does not use the `bucket` param, so it's okay passing an empty string for
 *   that
 */
export class LocalFsFilePersistenceProvider implements FilePersistenceProvider {
  protected dirNamepath: string;
  protected partsNamepath: string;

  constructor(private params: LocalFsFilePersistenceProviderParams) {
    fse.ensureDirSync(params.dir);
    fse.ensureDirSync(params.partsDir);
    this.dirNamepath = params.dir;
    this.partsNamepath = params.partsDir;
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

  uploadFile = async (
    params: FilePersistenceUploadFileParams
  ): Promise<FilePersistenceUploadFileResult> => {
    if (params.multipartId) {
      await this.writeStreamToPartsFile(params);
      appAssert(isNumber(params.part));
      return {
        multipartId: params.multipartId,
        part: params.part,
        partId: params.part.toString(),
        filepath: params.filepath,
        raw: undefined,
      };
    } else {
      const {mount, filepath} = params;
      const {nativePath} = this.toNativePath({
        fimidaraPath: filepath,
        mount: mount,
      });

      await this.writeStreamToFile(nativePath, params);
      return {filepath, raw: undefined};
    }
  };

  async completeMultipartUpload(
    params: FilePersistenceCompleteMultipartUploadParams
  ): Promise<FilePersistenceCompleteMultipartUploadResult> {
    await this.completePartsFile(params);
    return {filepath: params.filepath, raw: undefined};
  }

  async cleanupMultipartUpload(
    params: FilePersistenceCleanupMultipartUploadParams
  ) {
    await this.cleanupPartsFile(params);
  }

  async startMultipartUpload(
    params: FilePersistenceStartMultipartUploadParams
  ): Promise<FilePersistenceStartMultipartUploadResult> {
    return {multipartId: params.fileId};
  }

  async deleteMultipartUploadPart(
    params: FilePersistenceDeleteMultipartUploadPartParams
  ) {
    const {multipartId, part} = params;
    const partPath = pathJoin(
      this.partsNamepath,
      params.filepath,
      multipartId,
      part.toString()
    );
    await fse.promises.rm(partPath, {force: true});
  }

  readFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFile> => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({
      fimidaraPath: filepath,
      mount: mount,
    });
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
      const {nativePath} = this.toNativePath({
        fimidaraPath: key,
        mount: params.mount,
      });
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
      const {nativePath} = this.toNativePath({
        fimidaraPath: key,
        mount: params.mount,
      });
      await fse.promises.rm(nativePath, {recursive: true, force: true});
    });

    await Promise.all(rmPromises);
  };

  describeFile = async (
    params: FilePersistenceDescribeFileParams
  ): Promise<PersistedFileDescription<undefined> | undefined> => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({
      fimidaraPath: filepath,
      mount: mount,
    });
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
    const {nativePath} = this.toNativePath({
      fimidaraPath: folderpath,
      mount: mount,
    });
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
  ): Promise<
    FilePersistenceDescribeFolderContentResult<undefined, undefined>
  > => {
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
    const {fimidaraPath, mount} = params;
    const nativePath = defaultToNativePath(
      mount,
      fimidaraPath,
      this.dirNamepath
    );

    return {nativePath};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount} = params;
    const fimidaraPath = defaultToFimidaraPath(
      mount,
      nativePath,
      this.dirNamepath
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
    const {nativePath} = this.toNativePath({
      fimidaraPath: folderpath,
      mount: mount,
    });

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

      for (
        ;
        pageIndex < children.length && !stopSignal;
        pageIndex = pageIndex + max
      ) {
        await this.getLocalStats(
          children
            .slice(pageIndex, pageIndex + max)
            .map(p => pathJoin(nativePath, p)),
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
      kIjxUtils.logger().error(error);
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
          kIjxUtils.logger().error(error);
          return undefined;
        }
      })
    );

    return compact(items);
  }

  protected async writeStreamToFile(
    nativePath: string,
    params: Pick<FilePersistenceUploadFileParams, 'body'>
  ) {
    await fse.ensureFile(nativePath);
    return new Promise<void>((resolve, reject) => {
      const writeStream = fse.createWriteStream(nativePath, {
        autoClose: true,
        emitClose: true,
      });
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
      params.body.pipe(writeStream);
    });
  }

  protected async writeStreamToPartsFile(
    params: FilePersistenceUploadFileParams
  ) {
    appAssert(isNumber(params.part));
    appAssert(params.multipartId);
    const partPath = pathJoin(
      this.partsNamepath,
      params.filepath,
      params.multipartId,
      params.part.toString()
    );

    return this.writeStreamToFile(partPath, params);
  }

  protected async cleanupPartsFile(
    params: FilePersistenceCleanupMultipartUploadParams
  ) {
    const partsDir = pathJoin(
      this.partsNamepath,
      params.filepath,
      params.multipartId
    );
    await fse.promises.rm(partsDir, {recursive: true, force: true});
  }

  protected async completePartsFile(
    params: FilePersistenceCompleteMultipartUploadParams
  ) {
    const {nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });

    await fse.ensureFile(nativePath);
    const writeStream = fse.createWriteStream(nativePath, {
      autoClose: true,
      emitClose: true,
    });

    const partsDir = pathJoin(
      this.partsNamepath,
      params.filepath,
      params.multipartId
    );

    const sortedParts = params.parts.sort((a, b) => a.part - b.part);

    // TODO: this is not efficient because it reads the entire directory into
    // memory. Also, it writes the parts in order, which I think prolly there's a
    // better way to do this.
    for (const part of sortedParts) {
      const partPath = pathJoin(partsDir, part.part.toString());
      const partStream = fse.createReadStream(partPath, {autoClose: true});
      partStream.pipe(writeStream, {end: false});
      const promise = new Promise<void>((resolve, reject) => {
        partStream.on('end', resolve);
        partStream.on('error', reject);
      });

      // Wait for the part to finish writing to avoid a race condition
      await promise;
    }

    kIjxUtils.promises().callAndForget(() => this.cleanupPartsFile(params));
  }
}

export function getLocalFsDirFromSuppliedConfig(
  config: FimidaraSuppliedConfig = kIjxUtils.suppliedConfig()
) {
  const configLocalFsDir = config.localFsDir;
  const configLocalPartsFsDir = config.localPartsFsDir;

  assert(configLocalFsDir, 'localFsDir is required');
  assert(configLocalPartsFsDir, 'localPartsFsDir is required');

  const localFsDir = path.resolve(configLocalFsDir);
  const localPartsFsDir = path.resolve(configLocalPartsFsDir);

  return {localFsDir, localPartsFsDir};
}
