import {isArray} from 'lodash';
import {IFile} from '../../definitions/file';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  getFilePermissionOwners,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {splitFolderPath} from '../folders/utils';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {fileConstants} from './constants';
import FileQueries from './queries';
import {IPublicFile} from './types';

const fileFields = getFields<IPublicFile>({
  fileId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractorIfPresent,
  lastUpdatedAt: getDateStringIfPresent,
  name: true,
  description: true,
  folderId: true,
  mimetype: true,
  organizationId: true,
  size: true,
  encoding: true,
  extension: true,
  idPath: true,
  isPublic: true,
  markedPublicAt: getDateStringIfPresent,
  markedPublicBy: agentExtractorIfPresent,
  namePath: true,
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
  const organization = await checkOrganizationExists(
    context,
    file.organizationId
  );

  if (file.isPublic) {
    return {agent, file, organization};
  }

  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    file.fileId,
    AppResourceType.File,
    getFilePermissionOwners(organization.organizationId, file),
    action,
    nothrow
  );

  return {agent, file, organization};
}

// With file ID
export async function checkFileAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const file = await context.data.file.assertGetItem(FileQueries.getById(id));
  return checkFileAuthorization(context, agent, file, action, nothrow);
}

// With file path
export async function checkFileAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  path: string | string[],
  action: BasicCRUDActions,
  nothrow = false
) {
  const splitPath = isArray(path) ? path : splitFolderPath(path);
  const file = await context.data.file.assertGetItem(
    FileQueries.getByNamePath(organizationId, splitPath)
  );
  return checkFileAuthorization(context, agent, file, action, nothrow);
}

export interface ISplitFilenameWithDetails {
  name: string;
  extension: string;
  providedName: string;
}

export function splitFilenameWithDetails(
  providedName: string
): ISplitFilenameWithDetails {
  const splitStr = providedName.split(
    fileConstants.fileNameAndExtensionSeparator
  );
  const name = splitStr[0];
  const extension = splitStr
    .slice(1)
    .join(fileConstants.fileNameAndExtensionSeparator);
  return {
    providedName,
    name,
    extension,
  };
}

export function throwFileNotFound() {
  throw new NotFoundError('File not found');
}

export abstract class FileUtils {
  static getPublicFile = fileExtractor;
  static getPublicFileList = fileListExtractor;
}
