import {IFile, IFileMatcher} from '../../definitions/file';
import {IBaseContext} from '../contexts/BaseContext';
import EndpointReusableQueries from '../queries';
import {assertWorkspace} from '../workspaces/utils';
import FileQueries from './queries';
import {assertFile, splitfilepathWithDetails} from './utils';

export async function getFileWithMatcher(
  context: IBaseContext,
  matcher: IFileMatcher
) {
  if (matcher.fileId) {
    const file = await context.data.file.getItem(
      EndpointReusableQueries.getById(matcher.fileId)
    );

    return file;
  } else if (matcher.filepath) {
    const pathWithDetails = splitfilepathWithDetails(matcher.filepath);
    const workspace = await context.cacheProviders.workspace.getByRootname(
      context,
      pathWithDetails.workspaceRootname
    );

    assertWorkspace(workspace);
    const file = await context.data.file.getItem(
      pathWithDetails.extension
        ? FileQueries.getByNamePathAndExtention(
            workspace.resourceId,
            pathWithDetails.splitPathWithoutExtension,
            pathWithDetails.extension
          )
        : FileQueries.getByNamePath(
            workspace.resourceId,
            pathWithDetails.splitPathWithoutExtension
          )
    );

    return file;
  }

  return null;
}

export async function assertGetSingleFileWithMatcher(
  context: IBaseContext,
  matcher: IFileMatcher
): Promise<IFile> {
  const file = await getFileWithMatcher(context, matcher);
  assertFile(file);
  return file;
}
