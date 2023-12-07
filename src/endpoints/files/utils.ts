import {compact} from 'lodash';
import {container} from 'tsyringe';
import {
  File,
  FileMatcher,
  FilePresignedPath,
  FileResolvedMountEntry,
  PublicFile,
} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {Folder} from '../../definitions/folder';
import {PermissionAction} from '../../definitions/permissionItem';
import {Agent, AppResourceTypeMap, SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {getNewIdForResource, newWorkspaceResource} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injectables';
import {kInjectionKeys} from '../contexts/injection';
import {SemanticFileProvider} from '../contexts/semantic/file/types';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {SemanticWorkspaceProviderType} from '../contexts/semantic/workspace/types';
import {NotFoundError} from '../errors';
import {resolveBackendConfigsWithIdList} from '../fileBackends/configUtils';
import {
  FileBackendMountWeights,
  initBackendProvidersForMounts,
  isOnlyMountFimidara,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils';
import {kFolderConstants} from '../folders/constants';
import {
  FolderpathInfo,
  addRootnameToPath,
  ensureFolders,
  getFolderpathInfo,
} from '../folders/utils';
import {workspaceResourceFields} from '../utils';
import {assertWorkspace, checkWorkspaceExists} from '../workspaces/utils';
import {fileConstants} from './constants';
import {getFileByPresignedPath, getFileWithMatcher} from './getFilesWithMatcher';

const fileResolvedEntryFields = getFields<FileResolvedMountEntry>({
  mountId: true,
  resolvedAt: true,
});

export const fileResolvedEntryExtractor = makeExtract(fileResolvedEntryFields);
export const fileResolvedEntryListExtractor = makeListExtract(fileResolvedEntryFields);

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
  resolvedEntries: fileResolvedEntryListExtractor,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);

export async function checkFileAuthorization(
  agent: SessionAgent,
  file: Pick<File, 'idPath' | 'workspaceId'>,
  action: PermissionAction,
  opts?: SemanticProviderRunOptions
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

export async function readAndCheckFileAuthorization(
  agent: SessionAgent,
  matcher: FileMatcher,
  action: PermissionAction,
  opts: SemanticProviderMutationRunOptions
) {
  const file = await getFileWithMatcher(matcher, opts);
  assertFile(file);

  await checkFileAuthorization(agent, file, action);
  return file;
}

export async function checkFileAuthorization03(
  agent: SessionAgent,
  matcher: FileMatcher,
  action: PermissionAction,
  supportPresignedPath = false,
  incrementPresignedPathUsageCount = false,
  opts: SemanticProviderMutationRunOptions
) {
  if (matcher.filepath && supportPresignedPath) {
    const presignedPathResult = await getFileByPresignedPath(
      matcher.filepath,
      'readFile',
      incrementPresignedPathUsageCount,
      opts
    );

    if (presignedPathResult) {
      const {file, presignedPath} = presignedPathResult;
      return {file, presignedPath};
    }
  }

  const file = await getFileWithMatcher(matcher, opts);
  assertFile(file);

  await checkFileAuthorization(agent, file, action);
  return {file};
}

export interface FilenameInfo {
  filenameExcludingExt: string;
  extension?: string;
  providedName: string;
}

export function getFilenameInfo(providedName: string): FilenameInfo {
  providedName = providedName.startsWith('/') ? providedName.slice(1) : providedName;
  const [nameWithoutExtension, ...extensionList] = providedName.split(
    fileConstants.nameExtensionSeparator
  );
  let extension: string | undefined = extensionList.join(
    fileConstants.nameExtensionSeparator
  );

  // Handle file names without extension, seeing arr.join() would always produce
  // a string
  if (extension === '' && !providedName.endsWith(fileConstants.nameExtensionSeparator)) {
    extension = undefined;
  }

  return {
    providedName,
    extension,
    filenameExcludingExt: nameWithoutExtension,
  };
}

export interface FilepathInfo extends FilenameInfo, FolderpathInfo {
  filepathExcludingExt: string[];
}

export function getFilepathInfo(path: string | string[]): FilepathInfo {
  const folderpathInfo = getFolderpathInfo(path);
  const filenameInfo = getFilenameInfo(folderpathInfo.name);
  const pathWithoutExtension = [...folderpathInfo.namepath];
  pathWithoutExtension[pathWithoutExtension.length - 1] =
    filenameInfo.filenameExcludingExt;
  return {
    ...folderpathInfo,
    ...filenameInfo,
    filepathExcludingExt: pathWithoutExtension,
  };
}

export function throwFileNotFound() {
  throw new NotFoundError('File not found.');
}

export function throwFilePresignedPathNotFound() {
  throw new NotFoundError('File presigned path not found.');
}

export async function getWorkspaceFromFilepath(filepath: string): Promise<Workspace> {
  const workspaceModel = container.resolve<SemanticWorkspaceProviderType>(
    kInjectionKeys.semantic.workspace
  );

  const pathinfo = getFilepathInfo(filepath);
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

export function assertFile(
  file: File | FilePresignedPath | null | undefined
): asserts file {
  if (!file) throwFileNotFound();
}

export function stringifyFilenamepath(
  file: Pick<File, 'namepath' | 'extension'>,
  rootname?: string
) {
  const name =
    file.namepath.join(kFolderConstants.separator) +
    (file.extension ? `.${file.extension}` : '');
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
  const fileId = getNewIdForResource(AppResourceTypeMap.File);
  const file = newWorkspaceResource<File>(agent, AppResourceTypeMap.File, workspaceId, {
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
    resolvedEntries: [],
    ...seed,
  });

  return file;
}

export async function createNewFileAndEnsureFolders(
  agent: Agent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
  opts: SemanticProviderMutationRunOptions,
  seed: Partial<File> = {},
  parentFolder?: Folder | null
) {
  if (!parentFolder) {
    parentFolder = await ensureFolders(agent, workspace, pathinfo.parentPath, opts);
  }

  return createNewFile(agent, workspace.resourceId, pathinfo, parentFolder, data, seed);
}

export async function createAndInsertNewFile(
  agent: Agent,
  workspace: Workspace,
  pathinfo: FilepathInfo,
  data: Pick<File, 'description' | 'encoding' | 'mimetype'>,
  opts: SemanticProviderMutationRunOptions,
  seed: Partial<File> = {}
) {
  const file = await createNewFileAndEnsureFolders(
    agent,
    workspace,
    pathinfo,
    data,
    opts,
    seed
  );

  await kSemanticModels.file().insertItem(file, opts);
  return file;
}

export async function ingestFileByFilepath(
  agent: Agent,
  /** filepath with workspace rootname */
  filepath: string,
  opts: SemanticProviderMutationRunOptions,
  workspaceId: string,
  workspace?: Workspace,
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  const fileModel = container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file);

  const pathinfo = getFilepathInfo(filepath);

  if (!workspace) {
    workspace = await getWorkspaceFromFilepath(filepath);
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

  const mountFiles = await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.resourceId];
      appAssert(provider);

      return await provider.describeFile({
        workspaceId,
        mount,
        filepath: pathinfo.namepath.join(kFolderConstants.separator),
      });
    })
  );
  const mountFile = mountFiles.find(Boolean);

  let file = await fileModel.getOneByNamepath(
    {workspaceId, namepath: pathinfo.namepath, extension: pathinfo.extension},
    opts
  );

  if (mountFile && file) {
    file = await fileModel.getAndUpdateOneBynamepath(file, file, opts);
    appAssert(file);
  } else if (mountFile && !file) {
    file = await createAndInsertNewFile(agent, workspace, pathinfo, {}, opts, {
      isReadAvailable: true,
      isWriteAvailable: true,
      size: mountFile.size,
      lastUpdatedAt: mountFile.lastUpdatedAt,
      mimetype: mountFile.mimetype,
      encoding: mountFile.encoding,
    });
    appAssert(file);
  }

  return file;
}

export async function readOrIngestFileByFilepath(
  agent: Agent,
  /** filepath with workspace rootname */
  filepath: string,
  opts: SemanticProviderMutationRunOptions,
  workspaceId?: string
) {
  const fileModel = container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file);

  if (!workspaceId) {
    ({workspaceId} = await getWorkspaceFromFilepath(filepath));
  }

  const pathinfo = getFilepathInfo(filepath);
  const {mounts, mountWeights} = await resolveMountsForFolder(
    {workspaceId, namepath: pathinfo.parentSplitPath},
    opts
  );

  if (isOnlyMountFimidara(mounts)) {
    return await fileModel.getOneByNamepath(
      {
        workspaceId,
        extension: pathinfo.extension,
        namepath: pathinfo.namepath,
      },
      opts
    );
  }

  return await ingestFileByFilepath(
    agent,
    filepath,
    opts,
    workspaceId,
    /** workspace */ undefined,
    mounts,
    mountWeights
  );
}
