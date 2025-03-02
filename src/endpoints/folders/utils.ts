import {compact, defaultTo, first, isArray, keyBy, last} from 'lodash-es';
import {
  isPathEmpty,
  makeExtract,
  makeListExtract,
  pathJoin,
  pathSplit,
} from 'softkave-js-utils';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {
  FileBackendMount,
  ResolvedMountEntry,
} from '../../definitions/fileBackend.js';
import {Folder, FolderMatcher, PublicFolder} from '../../definitions/folder.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  Agent,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields} from '../../utils/extract.js';
import {
  getNewIdForResource,
  newWorkspaceResource,
} from '../../utils/resource.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {InvalidRequestError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';
import {getBackendConfigsWithIdList} from '../fileBackends/configUtils.js';
import {ingestPersistedFolders} from '../fileBackends/ingestionUtils.js';
import {
  FileBackendMountWeights,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils.js';
import {assertRootname, checkWorkspaceExists} from '../workspaces/utils.js';
import {createFolderList} from './addFolder/createFolderList.js';
import {kFolderConstants} from './constants.js';
import {assertGetFolderWithMatcher} from './getFolderWithMatcher.js';

const folderFields = getFields<PublicFolder>({
  ...workspaceResourceFields,
  parentId: true,
  name: true,
  description: true,
  idPath: true,
  namepath: true,
});

export const folderExtractor = makeExtract(folderFields);
export const folderListExtractor = makeListExtract(folderFields);

export function throwFolderNotFound() {
  throw kReuseableErrors.folder.notFound();
}

export function splitFolderpath(path: string | string[]) {
  if (isArray(path)) {
    return path;
  }

  const nameList = pathSplit({input: path});

  if (nameList.length > kFolderConstants.maxFolderDepth) {
    throw new Error(
      `Path depth exceeds max path depth of ${kFolderConstants.maxFolderDepth}`
    );
  }

  return nameList;
}

export function assertSplitFolderpath(path: string) {
  const splitPath = splitFolderpath(path);
  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return splitPath;
}

export interface FolderpathInfo {
  input: string | string[];
  name: string;
  /** path array without workspace rootname */
  namepath: string[];
  /** path string without workspace rootname */
  stringPath: string;
  /** parent namepath array split without rootname */
  parentNamepath: string[];
  /** parent namepath string without rootname */
  parentStringPath: string;
  hasParent: boolean;
  rootname?: string;
}

export interface GetFolderpathInfoOptions {
  /** Whether `input` contains workspace rootname or not */
  containsRootname: boolean;
  /** Whether to allow an empty folder name representing root folder or not */
  allowRootFolder: boolean;
}

export function getFolderpathInfo(
  input: string | string[],
  options: GetFolderpathInfoOptions
): FolderpathInfo {
  const {containsRootname, allowRootFolder} = options;
  const splitPath = splitFolderpath(input);
  const rootname = containsRootname ? splitPath.shift() : undefined;
  const name = defaultTo(last(splitPath), '');

  if (containsRootname) {
    assertWorkspaceRootname(rootname);
  }

  if (!allowRootFolder) {
    assertFileOrFolderName(name);
  }

  const parentNamepath = splitPath.slice(
    0,
    /** file or folder name is last item */ -1
  );
  const parentStringPath = pathJoin({input: parentNamepath});
  const stringPath = pathJoin({input: splitPath});
  const hasParent = parentNamepath.length > 0;

  return {
    namepath: splitPath,
    parentStringPath,
    parentNamepath,
    stringPath,
    hasParent,
    rootname,
    input,
    name,
  };
}

export function getWorkspaceRootnameFromPath(providedPath: string | string[]) {
  const splitPath = splitFolderpath(providedPath);
  const rootname = first(splitPath);
  assertWorkspaceRootname(rootname);
  return {rootname, splitPath};
}

export async function checkFolderAuthorization<
  T extends Pick<Folder, 'idPath' | 'workspaceId'>,
>(
  agent: SessionAgent,
  folder: T,
  action: FimidaraPermissionAction,
  workspace?: Workspace,
  opts?: SemanticProviderOpParams
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
  action: FimidaraPermissionAction,
  workspace?: Workspace,
  opts?: SemanticProviderMutationParams
) {
  const folder = await assertGetFolderWithMatcher(
    agent,
    matcher,
    opts,
    workspace?.workspaceId
  );
  return checkFolderAuthorization(agent, folder, action, workspace);
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

export function addRootnameToPath<
  T extends string | string[] = string | string[],
>(path: T, workspaceRootname: string | string[]): T {
  const rootname = isArray(workspaceRootname)
    ? last(workspaceRootname)
    : workspaceRootname;
  appAssert(rootname);
  const pJoined = pathJoin({input: [rootname, path]});

  if (isArray(path)) {
    return <T>pJoined.split(kFolderConstants.separator);
  }

  return <T>pJoined;
}

export function assertFolder(
  folder: Folder | null | undefined
): asserts folder {
  if (!folder) {
    throwFolderNotFound();
  }
}

export function stringifyFolderpath(
  folder: Pick<Folder, 'namepath'>,
  rootname?: string
) {
  const name = pathJoin({input: folder.namepath});
  return rootname ? addRootnameToPath(name, rootname) : name;
}

export function areFolderpathsEqual(
  folderpath01: string | string[],
  folderpath02: string | string[],
  isCaseSensitive: boolean
) {
  const folderpath01List = isArray(folderpath01)
    ? folderpath01
    : pathSplit({input: folderpath01});
  const folderpath02List = isArray(folderpath02)
    ? folderpath02
    : pathSplit({input: folderpath02});
  return (
    folderpath01List.length === folderpath02List.length &&
    folderpath01List.every((path, index) => {
      if (isCaseSensitive) {
        return path === folderpath02List[index];
      } else {
        return path.toLowerCase() === folderpath02List[index].toLowerCase();
      }
    })
  );
}

export async function ensureFolders(
  agent: SessionAgent,
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>,
  /** folder path **without** workspace rootname */
  namepath: string | string[]
): Promise<{folder: Folder | null; folders: Folder[]}> {
  if (isPathEmpty({input: namepath})) {
    return {folder: null, folders: []};
  }

  const {folders} = await createFolderList(
    agent,
    workspace,
    {
      folderpath: addRootnameToPath(
        pathJoin({input: namepath}),
        workspace.rootname
      ),
    },
    /** UNSAFE_skipAuthCheck. Since what we really care about is file creation, and
     * a separate permission check is done for that. All of it is also done
     * with transaction so should upload file permission check fail, it'll get
     * rolled back. Also, this allows for creating presigned paths to files in
     * folders that do not exist yet, which would otherwise fail seeing an
     * anonymous user most likely won't have permission to create folders. */
    true,
    /** throwOnFolderExists */ false,
    /** throwOnError */ true
  );

  const folder = last(folders) || null;
  return {folder, folders};
}

export async function getWorkspaceFromFolderpath(
  folderpath: string
): Promise<Workspace> {
  const workspaceModel = kIjxSemantic.workspace();
  const pathinfo = getFolderpathInfo(folderpath, {
    allowRootFolder: false,
    containsRootname: true,
  });
  assertRootname(pathinfo.rootname);
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
  pathinfo: Pick<FolderpathInfo, 'name'>,
  parentFolder: Pick<Folder, 'idPath' | 'namepath' | 'resourceId'> | null,
  /** represents external data */
  data: Pick<Folder, 'description'>,
  /** represents internal data */
  seed: Partial<Folder> = {}
) {
  const folderId = getNewIdForResource(kFimidaraResourceType.Folder);
  return newWorkspaceResource<Folder>(
    agent,
    kFimidaraResourceType.Folder,
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
      ...seed,
    }
  );
}

export async function ingestFolderByFolderpath(
  agent: SessionAgent,
  /** folderpath with workspace rootname */
  fimidaraFolderpath: string,
  workspaceId: string,
  workspace?: Workspace,
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  const pathinfo = getFolderpathInfo(fimidaraFolderpath, {
    allowRootFolder: false,
    containsRootname: true,
  });

  if (!workspace) {
    workspace = await getWorkspaceFromFolderpath(fimidaraFolderpath);
  }

  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder({
      workspaceId,
      namepath: pathinfo.parentNamepath,
    }));
  }

  const [configs, mountEntries] = await Promise.all([
    getBackendConfigsWithIdList(
      compact(mounts.map(mount => mount.configId)),
      /** throw error is config is not found */ true
    ),
    kIjxSemantic
      .resolvedMountEntry()
      .getLatestByFimidaraNamepathAndExt(
        workspace.resourceId,
        pathinfo.namepath,
        /** ext */ undefined
      ),
  ]);

  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const mountEntriesMapByMountId: Record<
    string,
    ResolvedMountEntry | undefined
  > = keyBy(mountEntries, mountEntry => mountEntry.mountId);

  const persistedFolderList = await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.resourceId];
      const mountEntry = mountEntriesMapByMountId[mount.resourceId];
      appAssert(provider);

      return await provider.describeFolder({
        mount,
        workspaceId,
        folderpath: mountEntry
          ? pathJoin({input: mountEntry.backendNamepath})
          : pathJoin({input: pathinfo.namepath}),
      });
    })
  );

  const folderEntry0 = first(persistedFolderList);

  if (folderEntry0) {
    await ingestPersistedFolders(
      agent,
      workspace,
      compact(persistedFolderList)
    );
  }
}

export async function readOrIngestFolderByFolderpath(
  agent: SessionAgent,
  /** folderpath with workspace rootname */
  folderpath: string,
  opts?: SemanticProviderOpParams,
  workspaceId?: string
) {
  const folderModel = kIjxSemantic.folder();
  let workspace: Workspace | undefined;

  if (!workspaceId) {
    workspace = await getWorkspaceFromFolderpath(folderpath);
    workspaceId = workspace.resourceId;
  }

  const pathinfo = getFolderpathInfo(folderpath, {
    allowRootFolder: false,
    containsRootname: true,
  });
  let folder = await folderModel.getOneByNamepath(
    {workspaceId, namepath: pathinfo.namepath},
    opts
  );

  if (!folder) {
    await ingestFolderByFolderpath(agent, folderpath, workspaceId, workspace);
    folder = await folderModel.getOneByNamepath(
      {workspaceId, namepath: pathinfo.namepath},
      opts
    );
  }

  return folder;
}
