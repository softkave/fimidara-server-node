import {IFile, IFileMatcher, IPublicFile} from '../../definitions/file';
import {AppActionType, ISessionAgent} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {ValidationError} from '../../utils/errors';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {
  checkAuthorization,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {folderConstants} from '../folders/constants';
import {IFolderpathWithDetails, splitPathWithDetails} from '../folders/utils';
import {workspaceResourceFields} from '../utils';
import {assertWorkspace, checkWorkspaceExists} from '../workspaces/utils';
import {fileConstants} from './constants';
import {assertGetSingleFileWithMatcher as assertGetFileWithMatcher} from './getFilesWithMatcher';

const fileFields = getFields<IPublicFile>({
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
  context: IBaseContext,
  agent: ISessionAgent,
  file: IFile,
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
  context: IBaseContext,
  agent: ISessionAgent,
  matcher: IFileMatcher,
  action: AppActionType,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const file = await assertGetFileWithMatcher(context, matcher, opts);
  return checkFileAuthorization(context, agent, file, action);
}

export interface ISplitFilenameWithDetails {
  nameWithoutExtension: string;
  extension?: string;
  providedName: string;
}

export function splitFilenameWithDetails(providedName: string): ISplitFilenameWithDetails {
  const splitStr = providedName.split(fileConstants.nameExtensionSeparator);
  let nameWithoutExtension = splitStr[0];
  let extension: string | undefined = splitStr.slice(1).join(fileConstants.nameExtensionSeparator);
  if (extension && !nameWithoutExtension) {
    nameWithoutExtension = extension;
    extension = undefined;
  }

  if (!nameWithoutExtension) {
    throw new ValidationError('File name is empty');
  }

  return {
    providedName,
    extension,
    nameWithoutExtension,
  };
}

export interface ISplitfilepathWithDetails
  extends ISplitFilenameWithDetails,
    IFolderpathWithDetails {
  splitPathWithoutExtension: string[];
}

export function splitfilepathWithDetails(path: string | string[]): ISplitfilepathWithDetails {
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
  throw new NotFoundError('File not found');
}

export function getFilePathWithoutRootname(file: IFile) {
  return `${file.namePath.join(folderConstants.nameSeparator)}${
    fileConstants.nameExtensionSeparator
  }${file.extension}`;
}

export async function getWorkspaceFromFilepath(context: IBaseContext, filepath: string) {
  const pathWithDetails = splitfilepathWithDetails(filepath);
  const workspace = await context.semantic.workspace.getByRootname(
    pathWithDetails.workspaceRootname
  );
  assertWorkspace(workspace);
  return workspace;
}

export async function getWorkspaceFromFileOrFilepath(
  context: IBaseContext,
  file?: IFile | null,
  filepath?: string
) {
  let workspace: IWorkspace | null = null;
  if (file) {
    workspace = await context.semantic.workspace.getOneById(file.workspaceId);
  } else if (filepath) {
    workspace = await getWorkspaceFromFilepath(context, filepath);
  }

  assertWorkspace(workspace);
  return workspace;
}

export function assertFile(file: IFile | null | undefined): asserts file {
  if (!file) {
    throwFileNotFound();
  }
}
