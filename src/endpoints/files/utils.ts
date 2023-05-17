import {File, FileMatcher, FilePresignedPath, PublicFile} from '../../definitions/file';
import {AppActionType, SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {
  checkAuthorization,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {NotFoundError} from '../errors';
import {folderConstants} from '../folders/constants';
import {FolderpathInfo, getFolderpathInfo} from '../folders/utils';
import {workspaceResourceFields} from '../utils';
import {assertWorkspace, checkWorkspaceExists} from '../workspaces/utils';
import {fileConstants} from './constants';
import {
  assertGetSingleFileWithMatcher as assertGetFileWithMatcher,
  getFileByPresignedPath,
} from './getFilesWithMatcher';

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
  namePath: true,
  // tags: assignedTagListExtractor,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);

export async function checkFileAuthorization(
  context: BaseContextType,
  agent: SessionAgent,
  file: File,
  action: AppActionType
) {
  const workspace = await checkWorkspaceExists(context, file.workspaceId);
  await checkAuthorization({
    context,
    agent,
    action,
    workspace,
    workspaceId: workspace.resourceId,
    containerId: getFilePermissionContainers(workspace.resourceId, file),
    targets: {targetId: file.resourceId},
  });

  return {agent, file, workspace};
}

export async function checkFileAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  matcher: FileMatcher,
  action: AppActionType,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const file = await assertGetFileWithMatcher(context, matcher, opts);
  await checkFileAuthorization(context, agent, file, action);
  return {file};
}

export async function checkFileAuthorization03(
  context: BaseContextType,
  agent: SessionAgent,
  matcher: FileMatcher,
  action: AppActionType,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (matcher.filepath) {
    const presignedPathResult = await getFileByPresignedPath(
      context,
      matcher.filepath,
      AppActionType.Read
    );

    if (presignedPathResult) {
      const {file, presignedPath} = presignedPathResult;
      return {file, presignedPath};
    }
  }

  const file = await assertGetFileWithMatcher(context, matcher, opts);
  await checkFileAuthorization(context, agent, file, action);
  return {file};
}

export interface FilenameInfo {
  nameWithoutExtension: string;
  extension?: string;
  providedName: string;
}

export function getFilenameInfo(providedName: string): FilenameInfo {
  providedName = providedName.startsWith('/') ? providedName.slice(1) : providedName;
  const [nameWithoutExtension, ...extensionList] = providedName.split(
    fileConstants.nameExtensionSeparator
  );
  let extension: string | undefined = extensionList.join(fileConstants.nameExtensionSeparator);

  if (extension === '' && !providedName.endsWith(fileConstants.nameExtensionSeparator)) {
    extension = undefined;
  }

  return {
    providedName,
    extension,
    nameWithoutExtension,
  };
}

export interface FilepathInfo extends FilenameInfo, FolderpathInfo {
  splitPathWithoutExtension: string[];
}

export function getFilepathInfo(path: string | string[]): FilepathInfo {
  const folderpathInfo = getFolderpathInfo(path);
  const filenameInfo = getFilenameInfo(folderpathInfo.name);
  const pathWithoutExtension = [...folderpathInfo.itemSplitPath];
  pathWithoutExtension[pathWithoutExtension.length - 1] = filenameInfo.nameWithoutExtension;
  return {
    ...folderpathInfo,
    ...filenameInfo,
    splitPathWithoutExtension: pathWithoutExtension,
  };
}

export function throwFileNotFound() {
  throw new NotFoundError('File not found.');
}

export async function getWorkspaceFromFilepath(context: BaseContextType, filepath: string) {
  const pathWithDetails = getFilepathInfo(filepath);
  const workspace = await context.semantic.workspace.getByRootname(
    pathWithDetails.workspaceRootname
  );
  assertWorkspace(workspace);
  return workspace;
}

export async function getWorkspaceFromFileOrFilepath(
  context: BaseContextType,
  file?: File | null,
  filepath?: string
) {
  let workspace: Workspace | null = null;

  if (file) workspace = await context.semantic.workspace.getOneById(file.workspaceId);
  else if (filepath) workspace = await getWorkspaceFromFilepath(context, filepath);

  assertWorkspace(workspace);
  return workspace;
}

export function assertFile(file: File | FilePresignedPath | null | undefined): asserts file {
  if (!file) throwFileNotFound();
}

export function stringifyNamePath(file: File) {
  return file.namePath.join(folderConstants.nameSeparator) + file.extension
    ? `.${file.extension}`
    : '';
}
