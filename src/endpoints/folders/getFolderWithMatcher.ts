import {IFolderMatcher} from '../../definitions/folder';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {assertWorkspace} from '../workspaces/utils';
import {assertFolder, splitPathWithDetails} from './utils';

export async function getFolderWithMatcher(
  context: IBaseContext,
  matcher: IFolderMatcher,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  if (matcher.folderId) {
    return await context.semantic.folder.getOneById(matcher.folderId, opts);
  } else if (matcher.folderpath) {
    const pathWithDetails = splitPathWithDetails(matcher.folderpath);
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
  context: IBaseContext,
  matcher: IFolderMatcher,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const folder = await getFolderWithMatcher(context, matcher, opts);
  assertFolder(folder);
  return folder;
}
