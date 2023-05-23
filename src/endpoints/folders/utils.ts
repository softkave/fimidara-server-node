import {defaultTo, first, isArray, last} from 'lodash';
import {Folder, FolderMatcher, PublicFolder} from '../../definitions/folder';
import {AppActionType, SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {
  checkAuthorization,
  getFilePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {workspaceResourceFields} from '../utils';
import {checkWorkspaceExists} from '../workspaces/utils';
import {folderConstants} from './constants';
import {FolderNotFoundError} from './errors';
import {assertGetFolderWithMatcher} from './getFolderWithMatcher';

const folderFields = getFields<PublicFolder>({
  ...workspaceResourceFields,
  parentId: true,
  name: true,
  description: true,
  idPath: true,
  namePath: true,
  // tags: assignedTagListExtractor,
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

  path = path.startsWith(folderConstants.nameSeparator) ? path.slice(1) : path;
  const p = path.split(folderConstants.nameSeparator).filter(item => !!item);
  if (p.length > folderConstants.maxFolderDepth) {
    throw new Error('Path depth exceeds max path depth (10).');
  }

  return p;
}

export function assertSplitFolderpath(path: string) {
  const splitPath = splitFolderpath(path);
  if (splitPath.length === 0) {
    throw new InvalidRequestError('Path is empty.');
  }

  return splitPath;
}

export interface FolderpathInfo {
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

export function getFolderpathInfo(providedPath: string | string[]): FolderpathInfo {
  const splitPath = splitFolderpath(providedPath);
  const workspaceRootname = defaultTo(first(splitPath), '');
  const name = defaultTo(last(splitPath), '');
  assertWorkspaceRootname(workspaceRootname);
  assertFileOrFolderName(name);
  const splitParentPath = splitPath.slice(
    1, // workspace rootname is 0
    -1 // file or folder name is last item
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

export function getWorkspaceRootnameFromPath(providedPath: string | string[]) {
  const splitPath = splitFolderpath(providedPath);
  const rootname = first(splitPath);
  assertWorkspaceRootname(rootname);
  return {rootname, splitPath};
}

export async function checkFolderAuthorization(
  context: BaseContextType,
  agent: SessionAgent,
  folder: Folder,
  action: AppActionType,
  workspace?: Workspace,
  UNSAFE_skipAuthCheck = false
) {
  if (!workspace) {
    workspace = await checkWorkspaceExists(context, folder.workspaceId);
  }

  if (!UNSAFE_skipAuthCheck) {
    // Primarily for listFolderContent, where we want to fetch the folder but
    // the calling agent doesn't need permission to read the folder, just it's
    // content.
    // TODO: Let me (@abayomi) know if there's an issue with this.
    await checkAuthorization({
      context,
      agent,
      action,
      workspace,
      workspaceId: workspace.resourceId,
      containerId: getFilePermissionContainers(workspace.resourceId, folder),
      targets: {targetId: folder.resourceId},
    });
  }

  return {agent, workspace, folder};
}

export async function checkFolderAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  matcher: FolderMatcher,
  action: AppActionType,
  workspace?: Workspace,
  opts?: SemanticDataAccessProviderRunOptions,
  UNSAFE_skipAuthCheck = false
) {
  const folder = await assertGetFolderWithMatcher(context, matcher, opts);
  return checkFolderAuthorization(context, agent, folder, action, workspace, UNSAFE_skipAuthCheck);
}

export function getFolderName(folder: Folder) {
  return folder.namePath.join(folderConstants.nameSeparator);
}

export function assertWorkspaceRootname(
  workspaceRootname?: string | null
): asserts workspaceRootname {
  if (!workspaceRootname) {
    throw new InvalidRequestError('Workspace rootname not provided');
  }
}

export function assertFileOrFolderName(fileOrFolderName?: string | null): asserts fileOrFolderName {
  if (!fileOrFolderName) {
    throw new InvalidRequestError('File or folder name not provided');
  }
}

export function addRootnameToPath<T extends string | string[] = string | string[]>(
  path: T,
  workspaceRootname: string | string[]
): T {
  const rootname = isArray(workspaceRootname) ? last(workspaceRootname) : workspaceRootname;
  if (isArray(path)) {
    return <T>[rootname, ...path];
  }

  return <T>`${rootname}${folderConstants.nameSeparator}${path}`;
}

export function assertFolder(folder: Folder | null | undefined): asserts folder {
  if (!folder) {
    throwFolderNotFound();
  }
}

export function stringifyFolderNamePath(file: Folder, rootname?: string) {
  const nm = file.namePath.join(folderConstants.nameSeparator);
  return rootname ? addRootnameToPath(nm, rootname) : nm;
}
