import {defaultTo, isArray, last} from 'lodash';
import {IFolder} from '../../definitions/folder';
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
import {InvalidRequestError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {folderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import FolderQueries from './queries';
import {IPublicFolder} from './types';

const folderFields = getFields<IPublicFolder>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractorIfPresent,
  lastUpdatedAt: getDateStringIfPresent,
  maxFileSizeInBytes: true,
  organizationId: true,
  parentId: true,
  name: true,
  description: true,
  idPath: true,
  isPublic: true,
  markedPublicAt: getDateStringIfPresent,
  markedPublicBy: agentExtractorIfPresent,
  namePath: true,
});

export const folderExtractor = makeExtract(folderFields);
export const folderListExtractor = makeListExtract(folderFields);

export function throwFolderNotFound() {
  throw new FolderNotFoundError();
}

export function splitFolderPath(path: string | string[]) {
  if (isArray(path)) {
    return path;
  }

  const p = path.split(folderConstants.nameSeparator).filter(item => !!item);

  if (p.length > folderConstants.maxFolderDepth) {
    throw new Error('Path depth exceeds max path depth (10)');
  }

  return p;
}

export function assertSplitFolderPath(path: string) {
  const splitPath = splitFolderPath(path);

  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return splitPath;
}

export interface IFolderPathWithDetails {
  path: string | string[];
  name: string;
  splitPath: string[];
  splitParentPath: string[];
  parentPath: string;
  hasParent: boolean;
}

export function splitPathWithDetails(
  path: string | string[]
): IFolderPathWithDetails {
  const splitPath = splitFolderPath(path);
  const name = defaultTo(last(splitPath), '');
  const splitParentPath = splitPath.slice(0, -1);
  const parentPath = splitParentPath.join(folderConstants.nameSeparator);
  const hasParent = splitParentPath.length > 0;
  return {
    hasParent,
    splitParentPath,
    splitPath,
    name,
    path,
    parentPath,
  };
}

export function assertSplitPathWithDetails(
  path: string
): IFolderPathWithDetails {
  const result = splitPathWithDetails(path);

  if (result.splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return result;
}

export async function checkFolderAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  folder: IFolder,
  action: BasicCRUDActions,
  nothrow = false
) {
  const organization = await checkOrganizationExists(
    context,
    folder.organizationId
  );

  if (folder.isPublic) {
    return {agent, folder, organization};
  }

  await checkAuthorization(
    context,
    agent,
    organization.resourceId,
    folder.resourceId,
    AppResourceType.Folder,
    getFilePermissionOwners(organization.resourceId, folder),
    action,
    nothrow
  );

  return {agent, folder, organization};
}

// With folder ID
export async function checkFolderAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const folder = await context.data.folder.assertGetItem(
    FolderQueries.getById(id)
  );
  return checkFolderAuthorization(context, agent, folder, action, nothrow);
}

// With folder path
export async function checkFolderAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  path: string | string[],
  action: BasicCRUDActions,
  nothrow = false
) {
  const splitPath = isArray(path) ? path : splitFolderPath(path);
  const folder = await context.data.folder.assertGetItem(
    FolderQueries.getByNamePath(organizationId, splitPath)
  );
  return checkFolderAuthorization(context, agent, folder, action, nothrow);
}

export abstract class FolderUtils {
  static getPublicFolder = folderExtractor;
  static getPublicFolderList = folderListExtractor;
  static throwFolderNotFound = throwFolderNotFound;
}
