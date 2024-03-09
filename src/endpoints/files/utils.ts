import {compact, first} from 'lodash';
import {File, FileMatcher, PublicFile} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {PermissionAction} from '../../definitions/permissionItem';
import {Agent, SessionAgent, kFimidaraResourceType} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {pathBasename, pathJoin} from '../../utils/fns';
import {getNewIdForResource, newWorkspaceResource} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {getBackendConfigsWithIdList} from '../fileBackends/configUtils';
import {ingestPersistedFiles} from '../fileBackends/ingestionUtils';
import {
  FileBackendMountWeights,
  initBackendProvidersForMounts,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils';
import {
  FolderpathInfo,
  addRootnameToPath,
  ensureFolders,
  getFolderpathInfo,
} from '../folders/utils';

import {PresignedPath, PublicPresignedPath} from '../../definitions/presignedPath';
import {workspaceResourceFields} from '../extractors';
import {assertRootname, assertWorkspace, checkWorkspaceExists} from '../workspaces/utils';
import {kFileConstants} from './constants';
import {getFileWithMatcher} from './getFilesWithMatcher';

const presignedPathFields = getFields<PublicPresignedPath>({
  ...workspaceResourceFields,
  namepath: true,
  fileId: true,
  issuerAgentTokenId: true,
  maxUsageCount: true,
  extension: true,
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
  extension: true,
  idPath: true,
  namepath: true,
  version: true,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);

export async function checkFileAuthorization(
  agent: SessionAgent,
  file: Pick<File, 'idPath' | 'workspaceId'>,
  action: PermissionAction,
  opts?: SemanticProviderTxnOptions
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
  action: PermissionAction;
  opts: SemanticProviderMutationTxnOptions;
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
  extension?: string;
  providedName: string;
}

export function getFilenameInfo(providedName: string): FilenameInfo {
  providedName = providedName.startsWith('/') ? providedName.slice(1) : providedName;
  const {basename, ext: extension} = pathBasename(providedName);

  return {
    providedName,
    extension,
    filenameExcludingExt: basename,
  };
}

export interface FilepathInfo extends FilenameInfo, FolderpathInfo {}

export function getFilepathInfo(
  path: string | string[],
  options: {/** Defaults to `true` */ containsRootname?: boolean} = {}
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

export async function getWorkspaceFromFilepath(filepath: string): Promise<Workspace> {
  const workspaceModel = kSemanticModels.workspace();
  const pathinfo = getFilepathInfo(filepath);
  assertRootname(pathinfo.rootname);
  const workspace = await workspaceModel.getByRootname(pathinfo.rootname);
  appAssert(
    workspace,
    kReuseableErrors.workspace.withRootnameNotFound(pathinfo.rootname)
  );
  return workspace;
}

export async function getWorkspaceFromFileOrFilepath(
  file?: Pick<File, 'workspaceId'> | null,
  filepath?: string
) {
  let workspace: Workspace | null = null;

  if (file) {
    workspace = await kSemanticModels.workspace().getOneById(file.workspaceId);
  } else if (filepath) {
    workspace = await getWorkspaceFromFilepath(filepath);
  }

  assertWorkspace(workspace);
  return workspace;
}

export function assertFile(file: File | PresignedPath | null | undefined): asserts file {
  if (!file) throwFileNotFound();
}

export function stringifyFilenamepath(
  file: Pick<File, 'namepath' | 'extension'>,
  rootname?: string
) {
  const name =
    pathJoin(file.namepath) +
    (file.extension ? `${kFileConstants.nameExtensionSeparator}${file.extension}` : '');
  return rootname ? addRootnameToPath(name, rootname) : name;
}

export function createNewFile(
  agent: Agent,
  workspaceId: string,
  pathinfo: FilepathInfo,
  parentFolder: Folder | null,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
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
      extension: pathinfo.extension,
      name: pathinfo.filenameExcludingExt,
      idPath: parentFolder ? parentFolder.idPath.concat(fileId) : [fileId],
      namepath: parentFolder
        ? parentFolder.namepath.concat(pathinfo.filenameExcludingExt)
        : [pathinfo.filenameExcludingExt],
      parentId: parentFolder?.resourceId ?? null,
      size: 0,
      isWriteAvailable: false,
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
  agent: Agent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
  opts: SemanticProviderMutationTxnOptions,
  seed: Partial<File> = {},
  parentFolder?: Folder | null
) {
  if (!parentFolder) {
    ({folder: parentFolder} = await ensureFolders(
      agent,
      workspace,
      pathinfo.parentStringPath,
      opts
    ));
  }

  return createNewFile(agent, workspace.resourceId, pathinfo, parentFolder, data, seed);
}

export async function ingestFileByFilepath(props: {
  /** agent used for ingesting */
  agent: Agent;
  /** filepath with extension and workspace rootname */
  filepath: string;
  opts: SemanticProviderMutationTxnOptions;
  workspace?: Workspace;
  /** Reuse mounts and mountWeights */
  mounts?: FileBackendMount[];
  mountWeights?: FileBackendMountWeights;
}) {
  const {agent, filepath, opts} = props;
  let {workspace, mounts, mountWeights} = props;
  const pathinfo = getFilepathInfo(filepath);

  if (!workspace) {
    workspace = await getWorkspaceFromFilepath(filepath);
  }

  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder(
      {workspaceId: workspace.resourceId, namepath: pathinfo.parentNamepath},
      opts
    ));
  }

  const configs = await getBackendConfigsWithIdList(
    compact(mounts.map(mount => mount.configId)),
    /** throw error is config is not found */ true,
    opts
  );
  const providersMap = await initBackendProvidersForMounts(mounts, configs);
  const fileEntries = await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.resourceId];
      appAssert(provider);

      return await provider.describeFile({
        mount,
        workspaceId: workspace!.resourceId,
        filepath: pathJoin(pathinfo.namepath),
      });
    })
  );

  const fileEntry0 = first(fileEntries);

  if (fileEntry0) {
    await ingestPersistedFiles(agent, workspace, compact(fileEntries));
  }
}
