import {isNumber} from 'lodash';
import {Readable} from 'stream';
import {appAssert} from '../../../utils/assertion';
import {streamToBuffer} from '../../../utils/fns';
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

type MemoryFilePersistenceProviderFile = PersistedFileDescription & {body: Buffer};

export default class MemoryFilePersistenceProvider implements FilePersistenceProvider {
  files: Record<
    /** workspaceId */ string,
    Record</** filepath, lowercased */ string, MemoryFilePersistenceProviderFile>
  > = {};

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
        return true;
      case 'deleteFolders':
        return false;
      case 'describeFile':
        return true;
      case 'describeFolder':
        return false;
      case 'describeFolderFiles':
        return true;
      case 'describeFolderFolders':
        return false;
      case 'readFile':
        return true;
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const body = await streamToBuffer(params.body);

    this.setMemoryFile(params, {
      body,
      filepath: params.filepath,
      type: 'file',
      lastUpdatedAt: Date.now(),
      size: body.byteLength,
    });

    return {};
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {
        body: Readable.from(file.body),
        size: file.size,
      };
    }

    return {body: undefined};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    params.filepaths.forEach(key => {
      delete workspaceFilesMap[key.toLowerCase()];
    });
  };

  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // not supported
  };

  close = async () => {
    this.files = {};
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {
        type: 'file',
        filepath: file.filepath,
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
      };
    }

    return undefined;
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    // not supported
    return undefined;
  };

  describeFolderFiles = async (
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    const workspaceFiles = Object.values(workspaceFilesMap);
    const files: PersistedFileDescription[] = [];
    appAssert(isNumber(params.page));

    let index = params.page;
    for (; index < workspaceFiles.length && files.length < params.max; index++) {
      const file = workspaceFiles[index];

      if (file.filepath.toLowerCase().startsWith(params.folderpath)) {
        files.push({
          type: 'file',
          filepath: file.filepath,
          lastUpdatedAt: file.lastUpdatedAt,
          size: file.size,
        });
      }
    }

    return {files, nextPage: index};
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    // not supported
    return {folders: []};
  };

  protected getWorkspaceFiles = (params: {workspaceId: string}) => {
    let workspaceFilesMap = this.files[params.workspaceId];

    if (!workspaceFilesMap) {
      workspaceFilesMap = this.files[params.workspaceId] = {};
    }

    return workspaceFilesMap;
  };

  protected setMemoryFile = (
    params: {workspaceId: string; filepath: string},
    file: MemoryFilePersistenceProviderFile
  ) => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    workspaceFilesMap[params.filepath.toLowerCase()] = file;
  };

  protected getMemoryFile = (params: {
    workspaceId: string;
    filepath: string;
  }): MemoryFilePersistenceProviderFile | undefined => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    return workspaceFilesMap[params.filepath.toLowerCase()];
  };
}
