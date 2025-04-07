import {compact, first, keyBy} from 'lodash-es';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {File, FileMatcher, PublicFile} from '../../definitions/file.js';
import {
  FileBackendMount,
  ResolvedMountEntry,
} from '../../definitions/fileBackend.js';
import {Folder} from '../../definitions/folder.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  PresignedPath,
  PublicPresignedPath,
} from '../../definitions/presignedPath.js';
import {
  Agent,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {pathBasename, pathJoin} from '../../utils/fns.js';
import {
  getNewIdForResource,
  newWorkspaceResource,
} from '../../utils/resource.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {NotFoundError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';
import {getBackendConfigsWithIdList} from '../fileBackends/configUtils.js';
import {ingestPersistedFiles} from '../fileBackends/ingestionUtils.js';
import {
  FileBackendMountWeights,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils.js';
import {
  FolderpathInfo,
  GetFolderpathInfoOptions,
  addRootnameToPath,
  ensureFolders,
  getFolderpathInfo,
} from '../folders/utils.js';
import {
  assertRootname,
  assertWorkspace,
  checkWorkspaceExists,
} from '../workspaces/utils.js';
import {kFileConstants} from './constants.js';
import {getFileWithMatcher} from './getFilesWithMatcher.js';

const presignedPathFields = getFields<PublicPresignedPath>({
  ...workspaceResourceFields,
  namepath: true,
  fileId: true,
  issuerAgentTokenId: true,
  maxUsageCount: true,
  ext: true,
  spentUsageCount: true,
  actions: true,
});

export const presignedPathExtractor = makeExtract(presignedPathFields);
export const presignedPathListExtractor = makeListExtract(presignedPathFields);

const fileFields = getFields<PublicFile>({
  ...workspaceResourceFields,
  name: true,
  description: true,
  parentId: true,
  mimetype: true,
  size: true,
  encoding: true,
  ext: true,
  idPath: true,
  namepath: true,
  version: true,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);

export async function checkFileAuthorization(
  agent: SessionAgent,
  file: Pick<File, 'idPath' | 'workspaceId'>,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  const workspace = await checkWorkspaceExists(file.workspaceId, opts);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    opts,
    workspaceId: workspace.resourceId,
    target: {
      action,
      targetId: getFilePermissionContainers(workspace.resourceId, file, true),
    },
  });

  return {agent, file, workspace};
}

export async function getAndCheckFileAuthorization(props: {
  agent: SessionAgent;
  matcher: FileMatcher;
  action: FimidaraPermissionAction;
  opts: SemanticProviderMutationParams;
  incrementPresignedPathUsageCount: boolean;
  shouldIngestFile?: boolean;
}) {
  const {
    agent,
    matcher,
    action,
    opts,
    incrementPresignedPathUsageCount,
    shouldIngestFile = true,
  } = props;
  const {file, presignedPath} = await getFileWithMatcher({
    matcher,
    opts,
    shouldIngestFile,
    supportPresignedPath: true,
    presignedPathAction: action,
    incrementPresignedPathUsageCount: incrementPresignedPathUsageCount,
  });
  assertFile(file);

  if (!presignedPath) {
    // Permission is already checked if there's a `presignedPath`
    await checkFileAuthorization(agent, file, action);
  }

  return file;
}

export interface FilenameInfo {
  filenameExcludingExt: string;
  ext?: string;
  providedName: string;
}

export function getFilenameInfo(providedName: string): FilenameInfo {
  providedName = providedName.startsWith('/')
    ? providedName.slice(1)
    : providedName;
  const {basename, ext} = pathBasename(providedName);

  return {
    providedName,
    ext,
    filenameExcludingExt: basename,
  };
}

export interface FilepathInfo extends FilenameInfo, FolderpathInfo {}

export function getFilepathInfo(
  path: string | string[],
  options: GetFolderpathInfoOptions
): FilepathInfo {
  const folderpathInfo = getFolderpathInfo(path, options);
  const filenameInfo = getFilenameInfo(folderpathInfo.name);
  folderpathInfo.namepath[folderpathInfo.namepath.length - 1] =
    filenameInfo.filenameExcludingExt;

  return {
    ...folderpathInfo,
    ...filenameInfo,
  };
}

export function throwFileNotFound() {
  throw new NotFoundError('File not found');
}

export function throwPresignedPathNotFound() {
  throw new NotFoundError('File presigned path not found');
}

export async function getWorkspaceFromFilepath(
  filepath: string
): Promise<{workspace: Workspace; pathinfo: FilepathInfo}> {
  const workspaceModel = kIjxSemantic.workspace();
  const pathinfo = getFilepathInfo(filepath, {
    allowRootFolder: false,
    containsRootname: true,
  });

  assertRootname(pathinfo.rootname);
  const workspace = await workspaceModel.getByRootname(pathinfo.rootname);
  appAssert(
    workspace,
    kReuseableErrors.workspace.withRootnameNotFound(pathinfo.rootname)
  );

  return {workspace, pathinfo};
}

export async function getWorkspaceFromFileOrFilepath(
  file?: Pick<File, 'workspaceId'> | null,
  filepath?: string
) {
  let workspace: Workspace | null = null;
  if (file) {
    workspace = await kIjxSemantic.workspace().getOneById(file.workspaceId);
  } else if (filepath) {
    ({workspace} = await getWorkspaceFromFilepath(filepath));
  }

  assertWorkspace(workspace);
  return workspace;
}

export function assertFile(
  file: File | PresignedPath | null | undefined
): asserts file {
  if (!file) throwFileNotFound();
}

export function stringifyFilenamepath(
  file: Pick<File, 'namepath' | 'ext'>,
  rootname?: string
) {
  const name =
    pathJoin(file.namepath) +
    (file.ext ? `${kFileConstants.nameExtSeparator}${file.ext}` : '');
  return rootname ? addRootnameToPath(name, rootname) : name;
}

export function createNewFile(
  agent: Agent,
  workspaceId: string,
  pathinfo: FilepathInfo,
  parentFolder: Folder | null,
  data: Pick<
    File,
    'description' | 'encoding' | 'mimetype' | 'clientMultipartId'
  >,
  seed: Partial<File> = {}
) {
  const fileId = getNewIdForResource(kFimidaraResourceType.File);
  const file = newWorkspaceResource<File>(
    agent,
    kFimidaraResourceType.File,
    workspaceId,
    {
      workspaceId: workspaceId,
      resourceId: fileId,
      ext: pathinfo.ext,
      name: pathinfo.filenameExcludingExt,
      idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
      namepath: parentFolder
        ? parentFolder.namepath.concat(pathinfo.filenameExcludingExt)
        : [pathinfo.filenameExcludingExt],
      parentId: parentFolder?.resourceId ?? null,
      size: 0,
      isWriteAvailable: true,
      isReadAvailable: false,
      version: 0,
      description: data.description,
      encoding: data.encoding,
      mimetype: data.mimetype,
      ...seed,
    }
  );

  return file;
}

export async function createNewFileAndEnsureFolders(
  agent: SessionAgent,
  workspace: Pick<Workspace, 'resourceId' | 'rootname'>,
  pathinfo: FilepathInfo,
  data: Pick<
    File,
    'description' | 'encoding' | 'mimetype' | 'clientMultipartId'
  >,
  seed: Partial<File> = {},
  parentFolder: Folder | null
) {
  if (!parentFolder) {
    ({folder: parentFolder} = await ensureFolders(
      agent,
      workspace,
      pathinfo.parentStringPath
    ));
  }

  const file = createNewFile(
    agent,
    workspace.resourceId,
    pathinfo,
    parentFolder,
    data,
    seed
  );

  return {file, parentFolder};
}

export async function ingestFileByFilepath(props: {
  /** agent used for ingesting */
  agent: SessionAgent;
  /** filepath with ext and workspace rootname */
  fimidaraFilepath: string;
  opts: SemanticProviderMutationParams;
  workspace?: Workspace;
  /** Reuse mounts and mountWeights */
  mounts?: FileBackendMount[];
  mountWeights?: FileBackendMountWeights;
}) {
  const {agent, fimidaraFilepath, opts} = props;
  let {workspace, mounts, mountWeights} = props;
  let pathinfo: FilepathInfo | undefined;

  if (!workspace) {
    ({workspace, pathinfo} = await getWorkspaceFromFilepath(fimidaraFilepath));
  }

  if (!pathinfo) {
    pathinfo = getFilepathInfo(fimidaraFilepath, {
      allowRootFolder: false,
      containsRootname: true,
    });
  }

  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder(
      {workspaceId: workspace.resourceId, namepath: pathinfo.parentNamepath},
      opts
    ));
  }

  const [configs, mountEntries] = await Promise.all([
    getBackendConfigsWithIdList(
      compact(mounts.map(mount => mount.configId)),
      /** throw error is config is not found */ true,
      opts
    ),
    kIjxSemantic
      .resolvedMountEntry()
      .getLatestByFimidaraNamepathAndExt(
        workspace.resourceId,
        pathinfo.namepath,
        pathinfo.ext,
        opts
      ),
  ]);

  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const mountEntriesMapByMountId: Record<
    string,
    ResolvedMountEntry | undefined
  > = keyBy(mountEntries, mountEntry => mountEntry.mountId);

  const persistedFileList = await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.resourceId];
      const mountEntry = mountEntriesMapByMountId[mount.resourceId];
      appAssert(provider);
      appAssert(workspace);
      appAssert(pathinfo);

      return await provider.describeFile({
        mount,
        workspaceId: workspace.resourceId,
        filepath: mountEntry
          ? stringifyFilenamepath({
              namepath: mountEntry.backendNamepath,
              ext: mountEntry.backendExt,
            })
          : stringifyFilenamepath({
              namepath: pathinfo.namepath,
              ext: pathinfo.ext,
            }),
        fileId: mountEntry?.forId,
      });
    })
  );

  const fileEntry0 = first(persistedFileList);

  if (fileEntry0) {
    await ingestPersistedFiles(agent, workspace, compact(persistedFileList));
  }
}
