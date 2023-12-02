import {isNumber} from 'lodash';
import {File} from '../../../definitions/file';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../folders/utils';
import {kSemanticModels, kUtilsInjectables} from '../injectables';
import {S3FilePersistenceProvider} from './S3FilePersistenceProvider';
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

export class FimidaraFilePersistenceProvider implements FilePersistenceProvider {
  backend: FilePersistenceProvider;

  constructor() {
    this.backend = this.getBackend();
  }

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

  describeFolderChildren = async (
    params: FilePersistenceProviderDescribeFolderChildrenParams
  ): Promise<FilePersistenceProviderDescribeFolderChildrenResult> => {
    const {folderpath, max, workspaceId, page} = params;
    appAssert(isNumber(page));

    const pathinfo = getFolderpathInfo(folderpath);
    const [files, folders] = await Promise.all([
      kSemanticModels
        .file()
        .getManyByNamepath(
          {workspaceId, namepath: pathinfo.namepath},
          {page: page as number, pageSize: max}
        ),
      kSemanticModels
        .folder()
        .getManyByNamepath(
          {workspaceId, namepath: pathinfo.namepath},
          {page, pageSize: max}
        ),
    ]);

    const childrenFiles = files.map((file): PersistedFileDescription => {
      return {
        filepath: stringifyFilenamepath(file),
        type: 'file',
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
      };
    });
    const childrenFolders = folders.map((folder): PersistedFolderDescription => {
      return {
        folderpath: stringifyFoldernamepath(folder),
        type: 'folder',
      };
    });

    return {page: page + 1, files: childrenFiles, folders: childrenFolders};
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
        return new S3FilePersistenceProvider(config.awsConfig);
      default:
        throw kReuseableErrors.file.unknownBackend(config.fileBackend);
    }
  };
}
