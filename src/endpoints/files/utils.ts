import {container} from 'tsyringe';
import {File, FileMatcher, FilePresignedPath, PublicFile} from '../../definitions/file';
import {FileBackendMount} from '../../definitions/fileBackend';
import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
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
import {
  initBackendProvidersFromConfigs,
  resolveBackendConfigsFromMounts,
} from '../fileBackends/configUtils';
import {
  FileBackendMountWeights,
  isOnlyMountFimidara,
  resolveMountsForFolder,
} from '../fileBackends/mountUtils';
import {kFolderConstants} from '../folders/constants';
import {FolderpathInfo, addRootnameToPath, getFolderpathInfo} from '../folders/utils';
import {workspaceResourceFields} from '../utils';
import {assertWorkspace, checkWorkspaceExists} from '../workspaces/utils';
import {fileConstants} from './constants';
import {getFileByPresignedPath, getFileWithMatcher} from './getFilesWithMatcher';

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
  file: File,
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

export function mergeFilesByMount(
  files: File[],
  mountWeights: FileBackendMountWeights
): File | null {
  throw kReuseableErrors.common.notImplemented();
}

export async function ingestFileByFilepath(
  /** filepath with workspace rootname */
  filepath: string,
  opts: SemanticProviderMutationRunOptions,
  workspaceId: string,
  mounts?: FileBackendMount[],
  mountWeights?: FileBackendMountWeights
) {
  const fileModel = container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file);

  const pathinfo = getFilepathInfo(filepath);

  if (!workspaceId) {
    ({workspaceId} = await getWorkspaceFromFilepath(filepath));
  }

  if (mounts) {
    appAssert(mountWeights);
  } else {
    ({mounts, mountWeights} = await resolveMountsForFolder(
      {workspaceId, namepath: pathinfo.parentSplitPath},
      opts
    ));
  }

  const configs = await resolveBackendConfigsFromMounts(mounts, true, opts);
  const providersMap = await initBackendProvidersFromConfigs(configs);

  const files = await Promise.all(
    mounts.map(async mount => {
      const provider = providersMap[mount.configId];
      appAssert(provider);

      return provider.normalizeFile(
        workspaceId,
        await provider.describeFile({
          key: pathinfo.namepath.join(kFolderConstants.separator),
        })
      );
    })
  );
  let file = mergeFilesByMount(files, mountWeights);

  if (file) {
    file = await fileModel.getAndUpdateOneBynamepath(file, file, opts);
  }

  return file;
}

export async function readOrIngestFileByFilepath(
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
    return await fileModel.getOneBynamepath(
      {
        workspaceId,
        extension: pathinfo.extension,
        namepath: pathinfo.namepath,
      },
      opts
    );
  }

  return await ingestFileByFilepath(filepath, opts, workspaceId, mounts, mountWeights);
}
