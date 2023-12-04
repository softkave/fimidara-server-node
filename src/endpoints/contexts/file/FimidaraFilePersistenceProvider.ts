import {isNumber} from 'lodash';
import {File} from '../../../definitions/file';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../folders/utils';
import {kSemanticModels, kUtilsInjectables} from '../injectables';
import LocalFsFilePersistenceProvider from './LocalFsFilePersistenceProvider';
import MemoryFilePersistenceProvider from './MemoryFilePersistenceProvider';
import {S3FilePersistenceProvider} from './S3FilePersistenceProvider';
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
  FilePersistenceUploadFileParams,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types';

export class FimidaraFilePersistenceProvider implements FilePersistenceProvider {
  backend: FilePersistenceProvider;

  constructor() {
    this.backend = this.getBackend();
  }

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
        return true;
      case 'deleteFolders':
        return true;
      case 'describeFile':
        return true;
      case 'describeFolder':
        return true;
      case 'describeFolderFiles':
        return true;
      case 'describeFolderFolders':
        return true;
      case 'readFile':
        return true;
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (
    params: FilePersistenceUploadFileParams
  ): Promise<Partial<File>> => {
    return await this.backend.uploadFile(params);
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    return await this.backend.readFile(params);
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {workspaceId, filepath} = params;
    const pathinfo = getFilepathInfo(filepath);
    const file = await kSemanticModels.file().getOneByNamepath({
      workspaceId,
      namepath: pathinfo.namepath,
      extension: pathinfo.extension,
    });

    if (file) {
      return {filepath, type: 'file', lastUpdatedAt: file.lastUpdatedAt, size: file.size};
    }

    return undefined;
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    const {workspaceId, folderpath} = params;
    const pathinfo = getFolderpathInfo(folderpath);
    const folder = await kSemanticModels.folder().getOneByNamepath({
      workspaceId,
      namepath: pathinfo.namepath,
    });

    if (folder) {
      return {folderpath, type: 'folder'};
    }

    return undefined;
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams): Promise<void> => {
    await this.backend.deleteFiles(params);
  };

  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // fimidara persisted folders are stored in DB, so no need to delete them
    // here, seeing deleteFolder will do that
  };

  describeFolderFiles = async (
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    const {folderpath, max, workspaceId, page} = params;
    appAssert(isNumber(page));

    const pathinfo = getFolderpathInfo(folderpath);
    const files = await kSemanticModels
      .file()
      .getManyByNamepath(
        {workspaceId, namepath: pathinfo.namepath},
        {page: page as number, pageSize: max}
      );

    const childrenFiles = files.map((file): PersistedFileDescription => {
      return {
        filepath: stringifyFilenamepath(file),
        type: 'file',
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
      };
    });

    return {nextPage: page + 1, files: childrenFiles};
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    const {folderpath, max, workspaceId, page} = params;
    appAssert(isNumber(page));

    const pathinfo = getFolderpathInfo(folderpath);
    const folders = await kSemanticModels
      .folder()
      .getManyByNamepath(
        {workspaceId, namepath: pathinfo.namepath},
        {page, pageSize: max}
      );

    const childrenFolders = folders.map((folder): PersistedFolderDescription => {
      return {
        folderpath: stringifyFoldernamepath(folder),
        type: 'folder',
      };
    });

    return {nextPage: page + 1, folders: childrenFolders};
  };

  close = async () => {
    await this.backend.close();
  };

  protected getBackend = (): FilePersistenceProvider => {
    const config = kUtilsInjectables.config();

    if (config.fileBackend === 'fimidara') {
      throw new Error(
        'Restart the server with a different file backend besides fimidara'
      );
    }

    switch (config.fileBackend) {
      case 'aws-s3':
        appAssert(config.awsConfig);
        return new S3FilePersistenceProvider(config.awsConfig);
      case 'local-fs':
        appAssert(config.localFsDir);
        return new LocalFsFilePersistenceProvider({dir: config.localFsDir});
      case 'memory':
        return new MemoryFilePersistenceProvider();
      default:
        throw kReuseableErrors.file.unknownBackend(config.fileBackend);
    }
  };
}
