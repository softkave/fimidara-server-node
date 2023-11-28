import {last} from 'lodash';
import {Folder, FolderMatcher} from '../../definitions/folder';
import {FileQuery} from '../contexts/data/types';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {assertWorkspace} from '../workspaces/utils';
import {assertFolder, getFolderpathInfo} from './utils';

export async function getClosestExistingFolder(
  workspaceId: string,
  namepath: string[],
  opts?: SemanticProviderRunOptions
): Promise<{folders: Folder[]; closestFolder: Folder | undefined}> {
  const folderQueries = namepath
    .map((p, i) => namepath.slice(0, i + 1))
    .map(
      (nextnamepath): FileQuery => ({
        workspaceId: workspaceId,
        namepath: {$all: nextnamepath, $size: nextnamepath.length},
      })
    );
  const folders = await context.semantic.folder.getManyByQueryList(folderQueries, opts);
  folders.sort((f1, f2) => f1.namepath.length - f2.namepath.length);
  return {folders, closestFolder: last(folders)};
}

export async function getFolderWithMatcher(
  matcher: FolderMatcher,
  opts?: SemanticProviderRunOptions
) {
  if (matcher.folderId) {
    return await context.semantic.folder.getOneById(matcher.folderId, opts);
  } else if (matcher.folderpath) {
    const pathWithDetails = getFolderpathInfo(matcher.folderpath);
    const workspace = await context.semantic.workspace.getByRootname(
      pathWithDetails.rootname
    );
    assertWorkspace(workspace);
    const folder = await context.semantic.folder.getOneBynamepath(
      workspace.resourceId,
      pathWithDetails.namepath,
      opts
    );
    return folder;
  }

  return null;
}

export async function assertGetFolderWithMatcher(
  matcher: FolderMatcher,
  opts?: SemanticProviderRunOptions
) {
  const folder = await getFolderWithMatcher(context, matcher, opts);
  assertFolder(folder);
  return folder;
}
