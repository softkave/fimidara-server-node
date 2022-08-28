import {IFile, IFileMatcher, IPublicFile} from '../../definitions/file';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {getDateString} from '../../utilities/dateFns';
import {ValidationError} from '../../utilities/errors';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  getFilePermissionOwners,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import {folderConstants} from '../folders/constants';
import {IFolderpathWithDetails, splitPathWithDetails} from '../folders/utils';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor} from '../utils';
import {assertWorkspace, checkWorkspaceExists} from '../workspaces/utils';
import {fileConstants} from './constants';
import {assertGetSingleFileWithMatcher as assertGetFileWithMatcher} from './getFilesWithMatcher';

const fileFields = getFields<IPublicFile>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
  folderId: true,
  mimetype: true,
  workspaceId: true,
  size: true,
  encoding: true,
  extension: true,
  idPath: true,
  namePath: true,
  tags: assignedTagListExtractor,
});

export const fileExtractor = makeExtract(fileFields);
export const fileListExtractor = makeListExtract(fileFields);

export async function checkFileAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  file: IFile,
  action: BasicCRUDActions,
  nothrow = false
) {
  const workspace = await checkWorkspaceExists(context, file.workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    resource: file,
    type: AppResourceType.File,
    permissionOwners: getFilePermissionOwners(
      workspace.resourceId,
      file,
      AppResourceType.File
    ),
  });

  return {agent, file, workspace};
}

export async function checkFileAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  matcher: IFileMatcher,
  action: BasicCRUDActions,
  nothrow = false
) {
  const file = await assertGetFileWithMatcher(context, matcher);
  return checkFileAuthorization(context, agent, file, action, nothrow);
}

export interface ISplitFilenameWithDetails {
  nameWithoutExtension: string;
  extension?: string;
  providedName: string;
}

export function splitFilenameWithDetails(
  providedName: string
): ISplitFilenameWithDetails {
  const splitStr = providedName.split(fileConstants.nameExtensionSeparator);
  let nameWithoutExtension = splitStr[0];
  let extension: string | undefined = splitStr
    .slice(1)
    .join(fileConstants.nameExtensionSeparator);

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

export function splitfilepathWithDetails(
  path: string | string[]
): ISplitfilepathWithDetails {
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

export async function getWorkspaceFromFilepath(
  context: IBaseContext,
  filepath: string
) {
  const pathWithDetails = splitfilepathWithDetails(filepath);
  const workspace = await context.cacheProviders.workspace.getByRootname(
    context,
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
    workspace = await context.cacheProviders.workspace.getById(
      context,
      file.workspaceId
    );
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
