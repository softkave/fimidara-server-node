import {IFolderMatcher} from '../../definitions/folder';
import {IBaseContext} from '../contexts/BaseContext';
import EndpointReusableQueries from '../queries';
import {assertWorkspace} from '../workspaces/utils';
import FolderQueries from './queries';
import {assertFolder, splitPathWithDetails} from './utils';

export async function getFolderWithMatcher(
  context: IBaseContext,
  matcher: IFolderMatcher
) {
  if (matcher.folderId) {
    return await context.data.folder.getItem(
      EndpointReusableQueries.getById(matcher.folderId)
    );
  } else if (matcher.folderpath) {
    const pathWithDetails = splitPathWithDetails(matcher.folderpath);
    const workspace = await context.cacheProviders.workspace.getByRootname(
      context,
      pathWithDetails.workspaceRootname
    );

    assertWorkspace(workspace);
    const folder = await context.data.folder.assertGetItem(
      FolderQueries.getByNamePath(
        workspace.resourceId,
        pathWithDetails.itemSplitPath
      )
    );

    return folder;
  }

  return null;
}

export async function assertGetFolderWithMatcher(
  context: IBaseContext,
  matcher: IFolderMatcher
) {
  const folder = await getFolderWithMatcher(context, matcher);
  assertFolder(folder);
  return folder;
}
