import {compact, defaultTo, first, isArray, last} from 'lodash';
import {posix} from 'path';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder, FolderMatcher, PublicFolder} from '../../definitions/folder';
import {PermissionAction} from '../../definitions/permissionItem';
import {Agent, SessionAgent, kAppResourceType} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {getNewIdForResource, newWorkspaceResource} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {InvalidRequestError} from '../errors';
import {getBackendConfigsWithIdList} from '../fileBackends/configUtils';
import {ingestPersistedFolders} from '../fileBackends/ingestionUtils';
import {
  FileBackendMountWeights,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils';
import {workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {createFolderListWithTransaction} from './addFolder/handler';
import {kFolderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import {assertGetFolderWithMatcher} from './getFolderWithMatcher';

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
  /** path array without workspace rootname */
  namepath: string[];
  /** parent namepath split without rootname */
  parentNamepath: string[];
  /** parent namepath without rootname */
  parentStringPath: string;
  hasParent: boolean;
  rootname: string;
}

export function getFolderpathInfo(
  input: string | string[],
  options: {
    /** Whether `input` contains workspace rootname or not. Defaults to `true`. */
    containsRootname?: boolean;
    /** Whether to allow an empty folder name representing root folder or not.
     * Defaults to `false`. */
    allowRootFolder?: boolean;
  } = {}
): FolderpathInfo {
  const {containsRootname = true, allowRootFolder = false} = options;
  const splitPath = splitFolderpath(input);
  const rootname = defaultTo(containsRootname ? splitPath.shift() : undefined, '');
  const name = defaultTo(last(splitPath), '');

  if (containsRootname) {
    assertWorkspaceRootname(rootname);
  }

  if (!allowRootFolder) {
    assertFileOrFolderName(name);
  }

  const parentNamepath = splitPath.slice(0, /** file or folder name is last item */ -1);
  const parentStringPath = parentNamepath.join(kFolderConstants.separator);
  const hasParent = parentNamepath.length > 0;

  return {
    hasParent,
    parentNamepath,
    name,
    rootname,
    input,
    parentStringPath,
    namepath: splitPath,
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
  folderpath02: string | string[],
  isCaseSensitive: boolean
) {
  const folderpath01List = isArray(folderpath01)
    ? folderpath01
    : folderpath01.split(kFolderConstants.separator);
  const folderpath02List = isArray(folderpath02)
    ? folderpath02
    : folderpath02.split(kFolderConstants.separator);
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
  workspace: Workspace,
  /** folder path **without** workspace rootname */
  namepath: string | string[],
  opts: SemanticProviderMutationRunOptions
): Promise<{folder: Folder | null; folders: Folder[]}> {
  if (!namepath || (isArray(namepath) && namepath.length === 0)) {
    return {folder: null, folders: []};
  }

  const {newFolders, existingFolders} = await createFolderListWithTransaction(
    agent,
    workspace,
    {
      folderpath: addRootnameToPath(
        isArray(namepath) ? namepath.join(kFolderConstants.separator) : namepath,
        workspace.rootname
      ),
    },
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

  existingFolders.sort((folder01, folder02) => {
    return folder01.namepath.length - folder02.namepath.length;
  });

  // newFolders should already be sorted, having parents comning first
  const folders = existingFolders.concat(newFolders);
  const folder = last(folders) || null;
  return {folder, folders};
}

export async function getWorkspaceFromFolderpath(folderpath: string): Promise<Workspace> {
  const workspaceModel = kSemanticModels.workspace();
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
  pathinfo: Pick<FolderpathInfo, 'name'>,
  parentFolder: Pick<Folder, 'idPath' | 'namepath' | 'resourceId'> | null,
  /** represents external data */
  data: Pick<Folder, 'description'>,
  /** represents internal data */
  seed: Partial<Folder> = {}
) {
  const folderId = getNewIdForResource(kAppResourceType.Folder);
  return newWorkspaceResource<Folder>(agent, kAppResourceType.Folder, workspaceId, {
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
  });
}

export async function createNewFolderAndEnsureParents(
  agent: Agent,
  workspace: Workspace,
  pathinfo: FolderpathInfo,
  data: Pick<Folder, 'description'>,
  opts: SemanticProviderMutationRunOptions,
  seed: Partial<Folder> = {}
) {
  const {folder} = await ensureFolders(agent, workspace, pathinfo.parentStringPath, opts);
  return createNewFolder(agent, workspace.resourceId, pathinfo, folder, data, seed);
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
  workspaceId: string,
  workspace?: Workspace,
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  const pathinfo = getFolderpathInfo(folderpath);

  if (!workspace) {
    workspace = await getWorkspaceFromFolderpath(folderpath);
  }

  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder({
      workspaceId,
      namepath: pathinfo.parentNamepath,
    }));
  }

  const configs = await getBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId)),
    /** throw error is config is not found */ true
  );
  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const folderEntries = await Promise.all(
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

  const folderEntry0 = first(folderEntries);

  if (folderEntry0) {
    await ingestPersistedFolders(agent, workspace, compact(folderEntries));
  }
}

export async function readOrIngestFolderByFolderpath(
  agent: Agent,
  /** folderpath with workspace rootname */
  folderpath: string,
  opts?: SemanticProviderRunOptions,
  workspaceId?: string
) {
  const folderModel = kSemanticModels.folder();
  let workspace: Workspace | undefined;

  if (!workspaceId) {
    workspace = await getWorkspaceFromFolderpath(folderpath);
    workspaceId = workspace.resourceId;
  }

  const pathinfo = getFolderpathInfo(folderpath);
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
