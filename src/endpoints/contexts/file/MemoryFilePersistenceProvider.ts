import {isNumber} from 'lodash';
import {Readable} from 'stream';
import {kAppResourceType} from '../../../definitions/system';
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
      case 'describeFile':
      case 'describeFolderFiles':
      case 'readFile':
      case 'uploadFile':
        return true;
      case 'deleteFolders':
      case 'describeFolder':
      case 'describeFolderFolders':
        return false;
    }
  };

  async uploadFile(params: FilePersistenceUploadFileParams) {
    const body = await streamToBuffer(params.body);

    this.setMemoryFile(params, {
      body,
      filepath: params.filepath,
      type: kAppResourceType.File,
      lastUpdatedAt: Date.now(),
      size: body.byteLength,
      mountId: params.mount.resourceId,
      mimetype: params.mimetype,
      encoding: params.encoding,
    });

    return {};
  }

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // not supported
  };

  dispose = async () => {
    this.files = {};
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {
        type: kAppResourceType.File,
        filepath: file.filepath,
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding,
        mountId: params.mount.resourceId,
      };
    }

    return undefined;
  };

  describeFolder = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    appAssert(isNumber(params.continuationToken));

    let index = params.continuationToken;
    for (; index < workspaceFiles.length && files.length < params.max; index++) {
      const file = workspaceFiles[index];

      if (file.filepath.toLowerCase().startsWith(params.folderpath)) {
        files.push({
          type: kAppResourceType.File,
          filepath: file.filepath,
          lastUpdatedAt: file.lastUpdatedAt,
          size: file.size,
          mimetype: file.mimetype,
          encoding: file.encoding,
          mountId: params.mount.resourceId,
        });
      }
    }

    return {files, continuationToken: index};
  };

  describeFolderFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    // not supported
    return {folders: []};
  };

  getWorkspaceFiles = (params: {workspaceId: string}) => {
    let workspaceFilesMap = this.files[params.workspaceId];

    if (!workspaceFilesMap) {
      workspaceFilesMap = this.files[params.workspaceId] = {};
    }

    return workspaceFilesMap;
  };

  setMemoryFile = (
    params: {workspaceId: string; filepath: string},
    file: MemoryFilePersistenceProviderFile
  ) => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    workspaceFilesMap[params.filepath.toLowerCase()] = file;
  };

  getMemoryFile = (params: {
    workspaceId: string;
    filepath: string;
  }): MemoryFilePersistenceProviderFile | undefined => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    return workspaceFilesMap[params.filepath.toLowerCase()];
  };
}
