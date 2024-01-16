import {isNumber} from 'lodash';
import {Readable} from 'stream';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {appAssert} from '../../../utils/assertion';
import {streamToBuffer} from '../../../utils/fns';
import {Omit1} from '../../../utils/types';
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

type MemoryFilePersistenceProviderFile = Omit1<PersistedFileDescription, 'filepath'> & {
  body: Buffer;
  nativePath: string;
};

export class MemoryFilePersistenceProvider implements FilePersistenceProvider {
  files: Record<
    /** workspaceId */ string,
    Record</** nativePath */ string, MemoryFilePersistenceProviderFile>
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
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    const body = await streamToBuffer(params.body);

    this.setMemoryFile(params, {
      body,
      nativePath,
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
        filepath: this.toFimidaraPath({nativePath: file.nativePath, mount: params.mount})
          .fimidaraPath,
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

      if (file.nativePath.startsWith(params.folderpath)) {
        const {fimidaraPath} = this.toFimidaraPath({
          nativePath: file.nativePath,
          mount: params.mount,
        });
        files.push({
          filepath: fimidaraPath,
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

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    const {fimidaraPath, mount, postMountedFromPrefix} = params;
    const nativePath = defaultToNativePath(
      mount,
      fimidaraPath,
      [],
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
      [],
      postMountedFromPrefix
    );
    return {fimidaraPath};
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
    mount: FileBackendMount;
  }): MemoryFilePersistenceProviderFile | undefined => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    return workspaceFilesMap[nativePath];
  };
}
