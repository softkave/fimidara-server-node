import fse from 'fs-extra';
import {compact, first, isNumber} from 'lodash';
import {appAssert} from '../../../utils/assertion';
import {noopAsync} from '../../../utils/fns';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderDescribeFolderChildrenParams,
  FilePersistenceProviderDescribeFolderChildrenResult,
  FilePersistenceUploadFileParams,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types';

export interface LocalFsFilePersistenceProviderParams {
  fileDir: string;
}

/**
 * - Does not use the `bucket` param, so it's okay passing an empty string for
 *   that
 */
export default class LocalFsFilePersistenceProvider implements FilePersistenceProvider {
  constructor(private params: LocalFsFilePersistenceProviderParams) {
    fse.ensureDirSync(params.fileDir);
  }

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const filepath = `${this.params.fileDir}/${params.filepath}`;
    await fse.ensureFile(filepath);

    return new Promise<{}>((resolve, reject) => {
      const writeStream = fse.createWriteStream(filepath, {
        autoClose: true,
        emitClose: true,
      });
      writeStream.on('close', () => resolve({}));
      writeStream.on('error', reject);
      params.body.pipe(writeStream);
    });
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const filepath = `${this.params.fileDir}/${params.filepath}`;
    const stat = await fse.promises.stat(filepath);

    if (!stat.isFile()) {
      return {body: undefined};
    }

    const stream = fse.createReadStream(filepath, {autoClose: true});
    return {body: stream, size: stat.size};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    if (params.filepaths.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    const rmPromises = params.filepaths.map(async key => {
      const filepath = `${this.params.fileDir}/${key}`;
      await fse.promises.rm(filepath);
    });

    await Promise.all(rmPromises);
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const filepath = `${this.params.fileDir}/${params.filepath}`;
    return first(
      await this.stat([filepath], (stat): PersistedFileDescription | undefined => {
        if (stat.isFile()) {
          return {
            type: 'file',
            filepath: params.filepath,
            size: stat.size,
            lastUpdatedAt: stat.mtimeMs,
          };
        }

        return undefined;
      })
    );
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    const folderpath = `${this.params.fileDir}/${params.folderpath}`;
    return first(
      await this.stat([folderpath], (stat): PersistedFolderDescription | undefined => {
        if (stat.isDirectory()) {
          return {type: 'folder', folderpath: params.folderpath};
        }

        return undefined;
      })
    );
  };

  describeFolderChildren = async (
    params: FilePersistenceProviderDescribeFolderChildrenParams
  ): Promise<FilePersistenceProviderDescribeFolderChildrenResult> => {
    const folderpath = `${this.params.fileDir}/${params.folderpath}`;
    appAssert(isNumber(params.page));

    try {
      // TODO: possible issue where folder children out use RAM. It's a string,
      // but there can be a lot.
      const children = await fse.promises.readdir(folderpath);
      const files: PersistedFileDescription[] = [];
      const folders: PersistedFolderDescription[] = [];

      for (
        let startIndex = params.page * params.max;
        startIndex < children.length ||
        // TODO: should the combination of files & folders be `params.max`, or
        // files and folders individually should be `params.max`
        (files.length >= params.max && folders.length >= params.max);
        startIndex = startIndex + params.max
      ) {
        await this.stat(
          children.slice(startIndex, startIndex + params.max),
          (stat, path) => {
            if (stat.isFile() && files.length < params.max) {
              files.push({
                type: 'file',
                filepath: path,
                size: stat.size,
                lastUpdatedAt: stat.mtimeMs,
              });
            } else if (stat.isDirectory() && folders.length < params.max) {
              folders.push({type: 'folder', folderpath: path});
            }
          }
        );
      }

      return {files, folders, page: params.page + 1};
    } catch (error) {
      console.error(error);
      return {files: [], folders: []};
    }
  };

  close = noopAsync;

  protected async stat<T>(
    paths: string[],
    process: (stat: fse.Stats, path: string) => T | undefined
  ): Promise<T[]> {
    const items = await Promise.all(
      paths.map(async nextPath => {
        try {
          const stat = await fse.promises.stat(nextPath);
          return process(stat, nextPath);
        } catch (error) {
          console.error(error);
          return undefined;
        }
      })
    );

    return compact(items);
  }
}
