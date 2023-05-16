import {File, FileMatcher, FilePresignedPath, PublicFile} from '../../definitions/file';
import {AppActionType, SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {ValidationError} from '../../utils/errors';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {
  checkAuthorization,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {NotFoundError} from '../errors';
import {folderConstants} from '../folders/constants';
import {FolderpathWithDetails, splitPathWithDetails} from '../folders/utils';
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

    if (presignedPathResult) return {file: presignedPathResult.file};
  }

  const file = await assertGetFileWithMatcher(context, matcher, opts);
  await checkFileAuthorization(context, agent, file, action);
  return {file};
}

export interface ISplitFilenameWithDetails {
  nameWithoutExtension: string;
  extension?: string;
  providedName: string;
}

export function splitFilenameWithDetails(providedName: string): ISplitFilenameWithDetails {
  providedName = providedName.startsWith('/') ? providedName.slice(1) : providedName;
  const splitStr = providedName.split(fileConstants.nameExtensionSeparator);
  let nameWithoutExtension = splitStr[0];
  let extension: string | undefined = splitStr.slice(1).join(fileConstants.nameExtensionSeparator);

  // TODO: this'll prevent files like .env from working
  if (extension && !nameWithoutExtension) {
    nameWithoutExtension = extension;
    extension = undefined;
  }

  if (extension === '' && !providedName.endsWith(fileConstants.nameExtensionSeparator)) {
    extension = undefined;
  }

  // TODO: this'll prevent files like .env from working
  if (!nameWithoutExtension) {
    throw new ValidationError('File name is empty.');
  }

  return {
    providedName,
    extension,
    nameWithoutExtension,
  };
}

export interface ISplitFilepathWithDetails
  extends ISplitFilenameWithDetails,
    FolderpathWithDetails {
  splitPathWithoutExtension: string[];
}

export function splitFilepathWithDetails(path: string | string[]): ISplitFilepathWithDetails {
  const pathWithDetails = splitPathWithDetails(path);
  const fileNameWithDetails = splitFilenameWithDetails(pathWithDetails.name);
  const splitPathWithoutExtension = [...pathWithDetails.itemSplitPath];
  splitPathWithoutExtension[splitPathWithoutExtension.length - 1] =
    fileNameWithDetails.nameWithoutExtension;
  return {
    ...pathWithDetails,
    ...fileNameWithDetails,
    splitPathWithoutExtension,
  };
}

export function throwFileNotFound() {
  throw new NotFoundError('File not found.');
}

export function getFilePathWithoutRootname(file: File) {
  return `${file.namePath.join(folderConstants.nameSeparator)}${
    fileConstants.nameExtensionSeparator
  }${file.extension}`;
}

export async function getWorkspaceFromFilepath(context: BaseContextType, filepath: string) {
  const pathWithDetails = splitFilepathWithDetails(filepath);
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
  if (file) {
    workspace = await context.semantic.workspace.getOneById(file.workspaceId);
  } else if (filepath) {
    workspace = await getWorkspaceFromFilepath(context, filepath);
  }

  assertWorkspace(workspace);
  return workspace;
}

export function assertFile(file: File | FilePresignedPath | null | undefined): asserts file {
  if (!file) throwFileNotFound();
}
