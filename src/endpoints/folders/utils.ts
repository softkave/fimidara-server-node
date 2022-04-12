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
import {getWorkspaceIdNoThrow} from '../contexts/SessionContext';
import {InvalidRequestError} from '../errors';
import {checkWorkspaceExists} from '../workspaces/utils';
import {assignedTagListExtractor} from '../tags/utils';
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
  workspaceId: true,
  parentId: true,
  name: true,
  description: true,
  idPath: true,
  namePath: true,
  tags: assignedTagListExtractor,
});

export const folderExtractor = makeExtract(folderFields);
export const folderListExtractor = makeListExtract(folderFields);

export function throwFolderNotFound() {
  throw new FolderNotFoundError();
}

export function splitfolderpath(path: string | string[]) {
  if (isArray(path)) {
    return path;
  }

  const p = path.split(folderConstants.nameSeparator).filter(item => !!item);

  if (p.length > folderConstants.maxFolderDepth) {
    throw new Error('Path depth exceeds max path depth (10)');
  }

  return p;
}

export function assertSplitfolderpath(path: string) {
  const splitPath = splitfolderpath(path);

  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return splitPath;
}

export interface IfolderpathWithDetails {
  providedPath: string | string[];
  name: string;
  splitPath: string[];
  splitParentPath: string[];
  parentPath: string;
  hasParent: boolean;
}

export function splitPathWithDetails(
  providedPath: string | string[]
): IfolderpathWithDetails {
  const splitPath = splitfolderpath(providedPath);
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
): IfolderpathWithDetails {
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
  const workspace = await checkWorkspaceExists(context, folder.workspaceId);

  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    resource: folder,
    type: AppResourceType.Folder,
    permissionOwners: getFilePermissionOwners(
      workspace.resourceId,
      folder,
      AppResourceType.Folder
    ),
  });

  return {agent, workspace, folder};
}

// With folder path
export async function checkFolderAuthorization02(
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
  const workspaceId = getWorkspaceIdNoThrow(agent, data.workspaceId);
  return {
    ...data,
    workspaceId,
  };
}
