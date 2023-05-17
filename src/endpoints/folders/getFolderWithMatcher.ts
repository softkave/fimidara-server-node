import {compact, last} from 'lodash';
import {FolderMatcher} from '../../definitions/folder';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {assertWorkspace} from '../workspaces/utils';
import {assertFolder, getFolderpathInfo} from './utils';

export async function getClosestExistingFolder(
  context: BaseContextType,
  workspaceId: string,
  namepath: string[]
) {
  const namePathList = namepath.map((p, i) => namepath.slice(0, i + 1));
  let folders = await context.semantic.folder.getManyByQuery({
    workspaceId: workspaceId,
    namePath: {$lowercaseIn: namePathList},
  });
  folders = compact(folders).sort((f1, f2) => f1.namePath.length - f2.namePath.length);
  return {folders, closestFolder: last(folders)};
}

export async function getFolderWithMatcher(
  context: BaseContextType,
  matcher: FolderMatcher,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (matcher.folderId) {
    return await context.semantic.folder.getOneById(matcher.folderId, opts);
  } else if (matcher.folderpath) {
    const pathWithDetails = getFolderpathInfo(matcher.folderpath);
    const workspace = await context.semantic.workspace.getByRootname(
      pathWithDetails.workspaceRootname
    );
    assertWorkspace(workspace);
    const folder = await context.semantic.folder.getOneByNamePath(
      workspace.resourceId,
      pathWithDetails.itemSplitPath,
      opts
    );
    return folder;
  }

  return null;
}

export async function assertGetFolderWithMatcher(
  context: BaseContextType,
  matcher: FolderMatcher,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const folder = await getFolderWithMatcher(context, matcher, opts);
  assertFolder(folder);
  return folder;
}
