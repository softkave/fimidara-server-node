import {defaultTo, first, isArray, last} from 'lodash';
import {IFolder, IFolderMatcher, IPublicFolder} from '../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  getFilePermissionOwners,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {assignedTagListExtractor} from '../tags/utils';
import {agentExtractor} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {folderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import {assertGetFolderWithMatcher} from './getFolderWithMatcher';

const folderFields = getFields<IPublicFolder>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
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

export function splitFolderpath(path: string | string[]) {
  if (isArray(path)) {
    return path;
  }

  const p = path.split(folderConstants.nameSeparator).filter(item => !!item);
  if (p.length > folderConstants.maxFolderDepth) {
    throw new Error('Path depth exceeds max path depth (10)');
  }

  return p;
}

export function assertSplitFolderpath(path: string) {
  const splitPath = splitFolderpath(path);
  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty');
  }

  return splitPath;
}

export interface IFolderpathWithDetails {
  providedPath: string | string[];
  name: string;

  // includes workspace rootname
  completeSplitPath: string[];

  // does not include workspace rootname
  itemSplitPath: string[];
  splitParentPath: string[];
  parentPath: string;
  hasParent: boolean;
  workspaceRootname: string;
}

export function splitPathWithDetails(
  providedPath: string | string[]
): IFolderpathWithDetails {
  const splitPath = splitFolderpath(providedPath);
  const workspaceRootname = defaultTo(first(splitPath), '');
  const name = defaultTo(last(splitPath), '');
  assertWorkspaceRootname(workspaceRootname);
  assertFileOrFolderName(name);
  const splitParentPath = splitPath.slice(
    /* workspace rootname is 0 */ 1,
    /* file or folder name is last item */ -1
  );

  const itemSplitPath = splitPath.slice(/* workspace rootname is 0 */ 1);
  const parentPath = splitParentPath.join(folderConstants.nameSeparator);
  const hasParent = splitParentPath.length > 0;
  return {
    hasParent,
    splitParentPath,
    name,
    parentPath,
    providedPath,
    workspaceRootname,
    itemSplitPath,
    completeSplitPath: splitPath,
  };
}

export function getRootname(providedPath: string | string[]) {
  const splitPath = splitFolderpath(providedPath);
  const workspaceRootname = defaultTo(first(splitPath), '');
  assertWorkspaceRootname(workspaceRootname);
  return workspaceRootname;
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

export function assertWorkspaceRootname(
  workspaceRootname?: string | null
): asserts workspaceRootname {
  if (!workspaceRootname) {
    throw new InvalidRequestError('Workspace rootname not provided');
  }
}

export function assertFileOrFolderName(
  fileOrFolderName?: string | null
): asserts fileOrFolderName {
  if (!fileOrFolderName) {
    throw new InvalidRequestError('File or folder name not provided');
  }
}

export function addRootnameToPath<
  T extends string | string[] = string | string[]
>(path: T, workspaceRootname: string | string[]): T {
  const rootname = isArray(workspaceRootname)
    ? last(workspaceRootname)
    : workspaceRootname;

  if (isArray(path)) {
    return <T>[rootname, ...path];
  }

  return <T>`${rootname}${folderConstants.nameSeparator}${path}`;
}

export function assertFolder(
  folder: IFolder | null | undefined
): asserts folder {
  if (!folder) {
    throwFolderNotFound();
  }
}
