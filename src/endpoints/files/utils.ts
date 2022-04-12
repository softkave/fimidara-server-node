import {IFile, IFileMatcher, IPublicFile} from '../../definitions/file';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {ValidationError} from '../../utilities/errors';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  getFilePermissionOwners,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {getWorkspaceIdNoThrow} from '../contexts/SessionContext';
import {NotFoundError} from '../errors';
import {folderConstants} from '../folders/constants';
import {IfolderpathWithDetails, splitPathWithDetails} from '../folders/utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {fileConstants} from './constants';
import {assertGetSingleFileWithMatcher} from './getFilesWithMatcher';

const fileFields = getFields<IPublicFile>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractorIfPresent,
  lastUpdatedAt: getDateStringIfPresent,
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
  const file = await assertGetSingleFileWithMatcher(context, matcher);
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
  const splitStr = providedName.split(
    fileConstants.fileNameAndExtensionSeparator
  );

  let nameWithoutExtension = splitStr[0];
  let extension: string | undefined = splitStr
    .slice(1)
    .join(fileConstants.fileNameAndExtensionSeparator);

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
    IfolderpathWithDetails {
  splitPathWithoutExtension: string[];
}

export function splitfilepathWithDetails(
  path: string | string[]
): ISplitfilepathWithDetails {
  const pathWithDetails = splitPathWithDetails(path);
  const fileNameWithDetails = splitFilenameWithDetails(pathWithDetails.name);
  const splitPathWithoutExtension = [...pathWithDetails.splitPath];
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

export function getFileName(file: IFile) {
  return `${file.namePath.join(folderConstants.nameSeparator)}${
    fileConstants.fileNameAndExtensionSeparator
  }${file.extension}`;
}

export function getFileMatcher(agent: ISessionAgent, data: IFileMatcher) {
  const workspaceId = getWorkspaceIdNoThrow(agent, data.workspaceId);
  return {
    ...data,
    workspaceId,
  };
}
