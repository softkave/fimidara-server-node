import {IFolderMatcher} from '../../definitions/folder';
import {IBaseContext} from '../contexts/types';
import {assertWorkspace} from '../workspaces/utils';
import {assertFolder, splitPathWithDetails} from './utils';

export async function getFolderWithMatcher(context: IBaseContext, matcher: IFolderMatcher) {
  if (matcher.folderId) {
    return await context.semantic.folder.getOneById(matcher.folderId);
  } else if (matcher.folderpath) {
    const pathWithDetails = splitPathWithDetails(matcher.folderpath);
    const workspace = await context.semantic.workspace.getByRootname(
      pathWithDetails.workspaceRootname
    );
    assertWorkspace(workspace);
    const folder = await context.semantic.folder.getOneByNamePath(
      workspace.resourceId,
      pathWithDetails.itemSplitPath
    );
    return folder;
  }

  return null;
}

export async function assertGetFolderWithMatcher(context: IBaseContext, matcher: IFolderMatcher) {
  const folder = await getFolderWithMatcher(context, matcher);
  assertFolder(folder);
  return folder;
}
