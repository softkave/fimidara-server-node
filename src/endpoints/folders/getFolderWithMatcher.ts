import {IFolderMatcher} from '../../definitions/folder';
import {IBaseContext} from '../contexts/types';
import EndpointReusableQueries from '../queries';
import WorkspaceQueries from '../workspaces/queries';
import {assertWorkspace} from '../workspaces/utils';
import FolderQueries from './queries';
import {assertFolder, splitPathWithDetails} from './utils';

export async function getFolderWithMatcher(context: IBaseContext, matcher: IFolderMatcher) {
  if (matcher.folderId) {
    return await context.data.folder.getOneByQuery(EndpointReusableQueries.getByResourceId(matcher.folderId));
  } else if (matcher.folderpath) {
    const pathWithDetails = splitPathWithDetails(matcher.folderpath);
    const workspace = await context.data.workspace.getOneByQuery(
      WorkspaceQueries.getByRootname(pathWithDetails.workspaceRootname)
    );
    assertWorkspace(workspace);
    const folder = await context.data.folder.assertGetOneByQuery(
      FolderQueries.getByNamePath(workspace.resourceId, pathWithDetails.itemSplitPath)
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
