import {defaultTo, isArray, last} from 'lodash';
import {IFolder, IFolderMatcher, IPublicFolder} from '../../definitions/folder';
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
import {getOrganizationIdNoThrow} from '../contexts/SessionContext';
import {InvalidRequestError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import {folderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import {assertGetFolderWithMatcher} from './getFolderWithMatcher';

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
  namePath: true,
  // publicAccessOps: publicAccessOpListExtractor,
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
  providedPath: string | string[];
  name: string;
  splitPath: string[];
  splitParentPath: string[];
  parentPath: string;
  hasParent: boolean;
}

export function splitPathWithDetails(
  providedPath: string | string[]
): IFolderPathWithDetails {
  const splitPath = splitFolderPath(providedPath);
  const name = defaultTo(last(splitPath), '');
  const splitParentPath = splitPath.slice(0, -1);
  const parentPath = splitParentPath.join(folderConstants.nameSeparator);
  const hasParent = splitParentPath.length > 0;
  return {
    hasParent,
    splitParentPath,
    splitPath,
    name,
    parentPath,
    providedPath,
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

  await checkAuthorization({
    context,
    agent,
    organization,
    action,
    nothrow,
    resource: folder,
    type: AppResourceType.Folder,
    permissionOwners: getFilePermissionOwners(
      organization.resourceId,
      folder,
      AppResourceType.Folder
    ),
  });

  return {agent, folder, organization};
}

// With folder path
export async function checkFolderAuthorization03(
  context: IBaseContext,
  agent: ISessionAgent,
  matcher: IFolderMatcher,
  action: BasicCRUDActions,
  nothrow = false
) {
  const folder = await assertGetFolderWithMatcher(context, matcher);
  return checkFolderAuthorization(context, agent, folder, action, nothrow);
}

export function getFolderName(folder: IFolder) {
  return folder.namePath.join(folderConstants.nameSeparator);
}

export function getFolderMatcher(agent: ISessionAgent, data: IFolderMatcher) {
  const organizationId = getOrganizationIdNoThrow(agent, data.organizationId);
  return {
    ...data,
    organizationId,
  };
}

export abstract class FolderUtils {
  static getPublicFolder = folderExtractor;
  static getPublicFolderList = folderListExtractor;
  static throwFolderNotFound = throwFolderNotFound;
}
