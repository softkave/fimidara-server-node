import {isNumber} from 'lodash';
import {Readable} from 'stream';
import {appAssert} from '../../../utils/assertion';
import {streamToBuffer} from '../../../utils/fns';
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

type MemoryFilePersistenceProviderFile = PersistedFileDescription & {body: Buffer};

export default class MemoryFilePersistenceProvider implements FilePersistenceProvider {
  files: Map<
    /** workspaceId */ string,
    Map</** filepath, lowercased */ string, MemoryFilePersistenceProviderFile>
  > = new Map();

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const body = await streamToBuffer(params.body);

    this.setFile(params, {
      body,
      filepath: params.filepath,
      type: 'file',
      lastUpdatedAt: Date.now(),
      size: body.byteLength,
    });

    return {};
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const file = this.getFile(params);

    if (file) {
      return {
        body: Readable.from(file.body),
        size: file.size,
      };
    }

    return {body: undefined};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    const workspaceMap = this.getWorkspaceMap(params);
    params.filepaths.forEach(key => {
      workspaceMap.delete(key);
    });
  };

  close = async () => {
    this.files = new Map();
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const file = this.getFile(params);

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
    return undefined;
  };

  describeFolderChildren = async (
    params: FilePersistenceProviderDescribeFolderChildrenParams
  ): Promise<FilePersistenceProviderDescribeFolderChildrenResult> => {
    const workspaceMap = this.getWorkspaceMap(params);
    const files: PersistedFileDescription[] = [];

    appAssert(isNumber(params.page));
    const startIndex = params.page * params.max;
    let index = 0;

    for (const [filepath, file] of workspaceMap.entries()) {
      if (index < startIndex) {
        index += 1;
        continue;
      }

      index += 1;

      if (filepath.startsWith(params.folderpath)) {
        files.push({
          type: 'file',
          filepath: file.filepath,
          lastUpdatedAt: file.lastUpdatedAt,
          size: file.size,
        });
      }
    }

    return {files, folders: []};
  };

  protected getWorkspaceMap = (params: {workspaceId: string}) => {
    let workspaceMap = this.files.get(params.workspaceId);

    if (!workspaceMap) {
      this.files.set(params.workspaceId, (workspaceMap = new Map()));
    }

    return workspaceMap;
  };

  protected setFile = (
    params: {workspaceId: string; filepath: string},
    file: MemoryFilePersistenceProviderFile
  ) => {
    const workspaceMap = this.getWorkspaceMap(params);
    workspaceMap.set(params.filepath.toLowerCase(), file);
  };

  protected getFile = (params: {workspaceId: string; filepath: string}) => {
    const workspaceMap = this.getWorkspaceMap(params);
    return workspaceMap.get(params.filepath.toLowerCase());
  };
}
