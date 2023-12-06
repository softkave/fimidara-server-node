import {compact, defaultTo, first, isArray, keyBy, last} from 'lodash';
import {posix} from 'path';
import {container} from 'tsyringe';
import {File, FileResolvedMountEntry} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {
  Folder,
  FolderMatcher,
  FolderResolvedMountEntry,
  PublicFolder,
} from '../../definitions/folder';
import {PermissionAction} from '../../definitions/permissionItem';
import {Agent, AppResourceTypeMap, SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {getNewIdForResource, newWorkspaceResource} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {
  FilePersistenceDescribeFolderFilesResult,
  FilePersistenceDescribeFolderFoldersResult,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../contexts/file/types';
import {kSemanticModels} from '../contexts/injectables';
import {kInjectionKeys} from '../contexts/injection';
import {SemanticFolderProvider} from '../contexts/semantic/folder/types';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {SemanticWorkspaceProviderType} from '../contexts/semantic/workspace/types';
import {InvalidRequestError} from '../errors';
import {resolveBackendConfigsWithIdList} from '../fileBackends/configUtils';
import {
  FileBackendMountWeights,
  initBackendProvidersForMounts,
  isOnlyMountFimidara,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils';
import {FilepathInfo, createNewFile, getFilepathInfo} from '../files/utils';
import {workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {createFolderListWithTransaction} from './addFolder/handler';
import {kFolderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import {assertGetFolderWithMatcher} from './getFolderWithMatcher';

const folderResolvedEntryFields = getFields<FolderResolvedMountEntry>({
  ...workspaceResourceFields,
  mountId: true,
  resolvedAt: true,
});

export const folderResolvedEntryExtractor = makeExtract(folderResolvedEntryFields);
export const folderResolvedEntryListExtractor = makeListExtract(
  folderResolvedEntryFields
);

const folderFields = getFields<PublicFolder>({
  ...workspaceResourceFields,
  parentId: true,
  name: true,
  description: true,
  idPath: true,
  namepath: true,
  resolvedEntries: folderResolvedEntryListExtractor,
});

export const folderExtractor = makeExtract(folderFields);
export const folderListExtractor = makeListExtract(folderFields);

export function throwFolderNotFound() {
  throw new FolderNotFoundError();
}

export function splitFolderpath(path: string | string[]) {
  if (isArray(path)) {
    return path;
  }

  const nameList = compact(posix.normalize(path).split(kFolderConstants.separator));

  if (nameList.length > kFolderConstants.maxFolderDepth) {
    throw new Error(
      `Path depth exceeds max path depth of ${kFolderConstants.maxFolderDepth}.`
    );
  }

  return nameList;
}

export function assertSplitFolderpath(path: string) {
  const splitPath = splitFolderpath(path);
  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty.');
  }

  return splitPath;
}

export interface FolderpathInfo {
  input: string | string[];
  name: string;
  /** path array with workspace rootname */
  splitPath: string[];
  /** path array without workspace rootname */
  namepath: string[];
  /** without rootname */
  parentSplitPath: string[];
  /** without rootname */
  parentPath: string;
  hasParent: boolean;
  rootname: string;
}

export function getFolderpathInfo(input: string | string[]): FolderpathInfo {
  const splitPath = splitFolderpath(input);
  const rootname = defaultTo(first(splitPath), '');
  const name = defaultTo(last(splitPath), '');
  assertWorkspaceRootname(rootname);
  assertFileOrFolderName(name);
  const parentSplitPath = splitPath.slice(
    /** workspace rootname is 0 */ 1,
    /** file or folder name is last item */ -1
  );
  const itemSplitPath = splitPath.slice(/* workspace rootname is 0 */ 1);
  const parentPath = parentSplitPath.join(kFolderConstants.separator);
  const hasParent = parentSplitPath.length > 0;
  return {
    hasParent,
    parentSplitPath,
    name,
    parentPath,
    splitPath,
    rootname,
    input,
    namepath: itemSplitPath,
  };
}

export function getWorkspaceRootnameFromPath(providedPath: string | string[]) {
  const splitPath = splitFolderpath(providedPath);
  const rootname = first(splitPath);
  assertWorkspaceRootname(rootname);
  return {rootname, splitPath};
}

export async function checkFolderAuthorization<
  T extends Pick<Folder, 'idPath' | 'workspaceId'>
>(
  agent: SessionAgent,
  folder: T,
  action: PermissionAction,
  workspace?: Workspace,
  opts?: SemanticProviderRunOptions
) {
  if (!workspace) {
    workspace = await checkWorkspaceExists(folder.workspaceId, opts);
  }

  await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {
      action,
      targetId: getFilePermissionContainers(workspace.resourceId, folder, true),
    },
  });

  return {agent, workspace, folder};
}

export async function checkFolderAuthorization02(
  agent: SessionAgent,
  matcher: FolderMatcher,
  action: PermissionAction,
  workspace?: Workspace,
  opts?: SemanticProviderMutationRunOptions
) {
  const folder = await assertGetFolderWithMatcher(
    agent,
    matcher,
    opts,
    workspace?.workspaceId
  );
  return checkFolderAuthorization(agent, folder, action, workspace);
}

export function getFolderName(folder: Folder) {
  return folder.namepath.join(kFolderConstants.separator);
}

export function assertWorkspaceRootname(
  workspaceRootname?: string | null
): asserts workspaceRootname {
  if (!workspaceRootname) {
    throw new InvalidRequestError('Workspace rootname not provided');
  }
}

export function assertFileOrFolderName(
  fileOrFolderName?: string | null
): asserts fileOrFolderName {
  if (!fileOrFolderName) {
    throw new InvalidRequestError('File or folder name not provided');
  }
}

export function addRootnameToPath<T extends string | string[] = string | string[]>(
  path: T,
  workspaceRootname: string | string[]
): T {
  const rootname = isArray(workspaceRootname)
    ? last(workspaceRootname)
    : workspaceRootname;
  if (isArray(path)) {
    return <T>[rootname, ...path];
  }

  return <T>`${rootname}${kFolderConstants.separator}${path}`;
}

export function assertFolder(folder: Folder | null | undefined): asserts folder {
  if (!folder) {
    throwFolderNotFound();
  }
}

export function stringifyFoldernamepath(
  folder: Pick<Folder, 'namepath'>,
  rootname?: string
) {
  const name = folder.namepath.join(kFolderConstants.separator);
  return rootname ? addRootnameToPath(name, rootname) : name;
}

export function areFolderpathsEqual(
  folderpath01: string | string[],
  folderpath02: string | string[]
) {
  const folderpath01List = isArray(folderpath01)
    ? folderpath01
    : folderpath01.split(kFolderConstants.separator);
  const folderpath02List = isArray(folderpath02)
    ? folderpath02
    : folderpath02.split(kFolderConstants.separator);
  return (
    folderpath01List.length === folderpath02List.length &&
    folderpath01List.every(
      (path, index) => path.toLowerCase() === folderpath02List[index].toLowerCase()
    )
  );
}

export async function ensureFolders(
  agent: SessionAgent,
  workspace: Workspace,
  /** folder path with workspace rootname */
  folderpath: string,
  opts: SemanticProviderMutationRunOptions
) {
  return await createFolderListWithTransaction(
    agent,
    workspace,
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)},
    /** Skip auth check. Since what we really care about is file creation, and
     * a separate permission check is done for that. All of it is also done
     * with transaction so should upload file permission check fail, it'll get
     * rolled back. Also, this allows for creating presigned paths to files in
     * folders that do not exist yet, which would otherwise fail seeing an
     * anonymous user most likely won't have permission to create folders. */
    true,
    /** Throw on folder exists */ false,
    opts
  );
}

export async function getWorkspaceFromFolderpath(folderpath: string): Promise<Workspace> {
  const workspaceModel = container.resolve<SemanticWorkspaceProviderType>(
    kInjectionKeys.semantic.workspace
  );

  const pathinfo = getFolderpathInfo(folderpath);
  const workspace = await workspaceModel.getByRootname(pathinfo.rootname);

  appAssert(
    workspace,
    kReuseableErrors.workspace.withRootnameNotFound(pathinfo.rootname)
  );
  return workspace;
}

export function createNewFolder(
  agent: Agent,
  workspaceId: string,
  pathinfo: FolderpathInfo,
  parentFolder: Pick<Folder, 'idPath' | 'namepath' | 'resourceId'> | null,
  data: Pick<Folder, 'description'>,
  seed: Partial<Folder> = {}
) {
  const folderId = getNewIdForResource(AppResourceTypeMap.Folder);
  const folder = newWorkspaceResource<Folder>(
    agent,
    AppResourceTypeMap.Folder,
    workspaceId,
    {
      workspaceId,
      resourceId: folderId,
      name: pathinfo.name,
      idPath: parentFolder ? parentFolder.idPath.concat(folderId) : [folderId],
      namepath: parentFolder
        ? parentFolder.namepath.concat(pathinfo.name)
        : [pathinfo.name],
      parentId: parentFolder?.resourceId ?? null,
      description: data.description,
      resolvedEntries: [],
      ...seed,
    }
  );

  return folder;
}

export async function createNewFolderAndEnsureParents(
  agent: Agent,
  workspace: Workspace,
  pathinfo: FolderpathInfo,
  data: Pick<Folder, 'description'>,
  opts: SemanticProviderMutationRunOptions,
  seed: Partial<Folder> = {}
) {
  const parentFolder = await ensureFolders(agent, workspace, pathinfo.parentPath, opts);
  return createNewFolder(agent, workspace.resourceId, pathinfo, parentFolder, data, seed);
}

export async function createAndInsertNewFolder(
  agent: Agent,
  workspace: Workspace,
  pathinfo: FolderpathInfo,
  data: Pick<Folder, 'description'>,
  opts: SemanticProviderMutationRunOptions,
  seed: Partial<Folder> = {}
) {
  const folder = await createNewFolderAndEnsureParents(
    agent,
    workspace,
    pathinfo,
    data,
    opts,
    seed
  );

  await kSemanticModels.folder().insertItem(folder, opts);
  return folder;
}

export async function ingestFolderByFolderpath(
  agent: Agent,
  /** folderpath with workspace rootname */
  folderpath: string,
  opts: SemanticProviderMutationRunOptions,
  workspaceId: string,
  workspace?: Workspace,
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  const folderModel = container.resolve<SemanticFolderProvider>(
    kInjectionKeys.semantic.folder
  );

  const pathinfo = getFolderpathInfo(folderpath);

  if (!workspace) {
    workspace = await getWorkspaceFromFolderpath(folderpath);
  }

  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder(
      {workspaceId, namepath: pathinfo.parentSplitPath},
      opts
    ));
  }

  const configs = await resolveBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId)),
    /** throw error is config is not found */ true,
    opts
  );
  const providersMap = await initBackendProvidersForMounts(mounts, configs);

  const mountFolders = await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.resourceId];
      appAssert(provider);

      return await provider.describeFolder({
        workspaceId,
        mount,
        folderpath: pathinfo.namepath.join(kFolderConstants.separator),
      });
    })
  );
  const mountFolder = mountFolders.find(Boolean);

  let folder = await folderModel.getOneByNamepath(
    {workspaceId, namepath: pathinfo.namepath},
    opts
  );

  if (folder) {
    folder = await folderModel.getAndUpdateOneBynamepath(folder, folder, opts);
    appAssert(folder);
  } else if (mountFolder && !folder) {
    folder = await createAndInsertNewFolder(agent, workspace, pathinfo, {}, opts);
    appAssert(folder);
  }

  return folder;
}

export type FileProviderContinuationTokensByMount = Record<
  /** mountId */ string,
  {continuationToken?: unknown; hex?: string}
>;

export async function ingestFolderFilesByFolderpath(
  agent: Agent,
  folder: Folder | null,
  opts: SemanticProviderMutationRunOptions,
  workspaceId: string,
  max: number,
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder(
      folder || {workspaceId, namepath: []},
      opts
    ));
  }

  const configs = await resolveBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId)),
    /** throw error is config is not found */ true,
    opts
  );

  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const resultList = await Promise.all(
    mounts.map(async (mount): Promise<FilePersistenceDescribeFolderFilesResult> => {
      const provider = providersMap[mount.resourceId];
      const continuationToken = provider.parseContinuationToken(
        mount.ingestFilesContinuationToken
      );

      if (!continuationToken) {
        return {files: []};
      }

      return await provider.describeFolderFiles({
        workspaceId,
        mount,
        max,
        continuationToken,
        folderpath: (folder?.namepath || []).join(kFolderConstants.separator),
      });
    })
  );

  const mountContinuationTokensMap: FileProviderContinuationTokensByMount = {};
  const mountFilesMap: Record<
    string,
    {
      pathinfo: FilepathInfo;
      mountFiles: PersistedFileDescription[];
      mountEntries: FileResolvedMountEntry[];
    }
  > = {};

  resultList.forEach((nextResult, index) => {
    const {files, continuationToken} = nextResult;

    appAssert(mounts);
    const mount = mounts[index];
    const provider = providersMap[mount.resourceId];

    mountContinuationTokensMap[mount.resourceId] = {
      continuationToken,
      hex: provider.stringifyContinuationToken(continuationToken),
    };

    files.forEach(nextMountFile => {
      let map = mountFilesMap[nextMountFile.filepath];

      if (!map) {
        map = mountFilesMap[nextMountFile.filepath] = {
          pathinfo: getFilepathInfo(nextMountFile.filepath),
          mountFiles: [],
          mountEntries: [],
        };
      }

      map.mountFiles.push(nextMountFile);
      map.mountEntries.push({mountId: nextMountFile.mountId, resolvedAt: getTimestamp()});
    });
  });

  const extMountFilesList = Object.values(mountFilesMap);

  // TODO: use $or query instead
  const existingFiles = compact(
    await Promise.all(
      extMountFilesList.map(({pathinfo}) => {
        return kSemanticModels.file().getOneByNamepath({
          workspaceId,
          namepath: pathinfo.namepath,
          extension: pathinfo.extension,
        });
      })
    )
  );

  const existingFilesMap = keyBy(existingFiles, file =>
    file.namepath.join(kFolderConstants.separator)
  );

  const newFiles: Array<File> = [];
  extMountFilesList.forEach(({pathinfo, mountFiles}) => {
    const mountFile0 = first(mountFiles);
    appAssert(mountFile0);

    if (!existingFilesMap[mountFile0.filepath]) {
      newFiles.push(
        createNewFile(
          agent,
          workspaceId,
          pathinfo,
          folder,
          /** new file input */ {},
          /** file seed */ {
            lastUpdatedAt: mountFile0.lastUpdatedAt,
          }
        )
      );
    }
  });

  const updateFilesPromise = Promise.all(
    existingFiles.map(file => {
      const entry = mountFilesMap[file.namepath.join(kFolderConstants.separator)];

      return kSemanticModels
        .file()
        .getAndUpdateOneById(
          file.resourceId,
          {resolvedEntries: entry.mountEntries},
          opts
        );
    })
  );
  const saveFilesPromise = kSemanticModels.file().insertItem(newFiles, opts);
  const saveContinuationTokensPromise = Promise.all(
    mounts.map(mount => {
      const {hex} = mountContinuationTokensMap[mount.resourceId];
      return kSemanticModels
        .fileBackendMount()
        .updateOneById(
          mount.resourceId,
          {ingestFilesContinuationToken: hex, filesIngestedCompletely: !hex},
          opts
        );
    })
  );
  const [updatedFiles] = await Promise.all([
    updateFilesPromise,
    saveFilesPromise,
    saveContinuationTokensPromise,
  ]);
  const completedFiles = compact(updatedFiles).concat(newFiles);

  return {files: completedFiles};
}

export async function ingestFolderFoldersByFolderpath(
  agent: Agent,
  folder: Folder | null,
  opts: SemanticProviderMutationRunOptions,
  workspaceId: string,
  max: number,
  // TODO: reuse mounts and providers
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder(
      folder || {workspaceId, namepath: []},
      opts
    ));
  }

  const configs = await resolveBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId)),
    /** throw error is config is not found */ true,
    opts
  );

  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const resultList = await Promise.all(
    mounts.map(async (mount): Promise<FilePersistenceDescribeFolderFoldersResult> => {
      const provider = providersMap[mount.resourceId];
      const continuationToken = provider.parseContinuationToken(
        mount.ingestFoldersContinuationToken
      );

      if (!continuationToken) {
        /** short-circuit, mount is done */
        return {folders: []};
      }

      return await provider.describeFolderFolders({
        workspaceId,
        mount,
        continuationToken,
        max,
        folderpath: (folder?.namepath || []).join(kFolderConstants.separator),
      });
    })
  );

  const mountContinuationTokensMap: FileProviderContinuationTokensByMount = {};
  const mountFoldersMap: Record<
    string,
    {
      pathinfo: FolderpathInfo;
      mountFolders: PersistedFolderDescription[];
      mountEntries: FolderResolvedMountEntry[];
    }
  > = {};

  resultList.forEach((nextResult, index) => {
    const {folders, continuationToken} = nextResult;

    appAssert(mounts);
    const mount = mounts[index];
    const provider = providersMap[mount.resourceId];

    mountContinuationTokensMap[mount.resourceId] = {
      continuationToken,
      hex: provider.stringifyContinuationToken(continuationToken),
    };

    folders.forEach(nextMountFolder => {
      let map = mountFoldersMap[nextMountFolder.folderpath];

      if (!map) {
        map = mountFoldersMap[nextMountFolder.folderpath] = {
          pathinfo: getFolderpathInfo(nextMountFolder.folderpath),
          mountFolders: [],
          mountEntries: [],
        };
      }

      map.mountFolders.push(nextMountFolder);
      map.mountEntries.push({
        mountId: nextMountFolder.mountId,
        resolvedAt: getTimestamp(),
      });
    });
  });

  const extMountFoldersList = Object.values(mountFoldersMap);

  // TODO: use $or query instead
  const existingFolders = compact(
    await Promise.all(
      extMountFoldersList.map(({pathinfo}) => {
        return kSemanticModels.folder().getOneByNamepath({
          workspaceId,
          namepath: pathinfo.namepath,
        });
      })
    )
  );

  const existingFoldersMap = keyBy(existingFolders, file =>
    file.namepath.join(kFolderConstants.separator)
  );

  const newFolders: Array<Folder> = [];

  extMountFoldersList.forEach(({pathinfo, mountFolders: mountFiles}) => {
    const mountFolder0 = first(mountFiles);
    appAssert(mountFolder0);

    if (!existingFoldersMap[mountFolder0.folderpath]) {
      newFolders.push(
        createNewFolder(agent, workspaceId, pathinfo, folder, /** new folder input */ {})
      );
    }
  });

  const updateFoldersPromise = Promise.all(
    existingFolders.map(folder => {
      const entry = mountFoldersMap[folder.namepath.join(kFolderConstants.separator)];
      appAssert(entry);
      return kSemanticModels
        .folder()
        .getAndUpdateOneById(
          folder.resourceId,
          {resolvedEntries: entry.mountEntries},
          opts
        );
    })
  );
  const saveFoldersPromise = kSemanticModels.folder().insertItem(newFolders, opts);
  const saveContinuationTokensPromise = Promise.all(
    mounts.map(mount => {
      const {hex} = mountContinuationTokensMap[mount.resourceId];
      return kSemanticModels
        .fileBackendMount()
        .updateOneById(
          mount.resourceId,
          {ingestFoldersContinuationToken: hex, foldersIngestedCompletely: !hex},
          opts
        );
    })
  );
  const [updatedFolders] = await Promise.all([
    updateFoldersPromise,
    saveFoldersPromise,
    saveContinuationTokensPromise,
  ]);
  const completedFolders = compact(updatedFolders).concat(newFolders);

  return {folders: completedFolders, continuationToken: mountContinuationTokensMap};
}

export async function readOrIngestFolderByFolderpath(
  agent: Agent,
  /** folderpath with workspace rootname */
  folderpath: string,
  opts: SemanticProviderMutationRunOptions,
  workspaceId?: string
) {
  const folderModel = container.resolve<SemanticFolderProvider>(
    kInjectionKeys.semantic.folder
  );

  if (!workspaceId) {
    ({workspaceId} = await getWorkspaceFromFolderpath(folderpath));
  }

  const pathinfo = getFolderpathInfo(folderpath);
  const {mounts, mountWeights} = await resolveMountsForFolder(
    {workspaceId, namepath: pathinfo.parentSplitPath},
    opts
  );

  if (isOnlyMountFimidara(mounts)) {
    return await folderModel.getOneByNamepath(
      {workspaceId, namepath: pathinfo.namepath},
      opts
    );
  }

  return await ingestFolderByFolderpath(
    agent,
    folderpath,
    opts,
    workspaceId,
    /** workspace */ undefined,
    mounts,
    mountWeights
  );
}
