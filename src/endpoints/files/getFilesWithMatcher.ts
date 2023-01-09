import {IFile, IFileMatcher} from '../../definitions/file';
import {IBaseContext} from '../contexts/types';
import EndpointReusableQueries from '../queries';
import WorkspaceQueries from '../workspaces/queries';
import {assertWorkspace} from '../workspaces/utils';
import FileQueries from './queries';
import {assertFile, splitfilepathWithDetails} from './utils';

export async function getFileWithMatcher(context: IBaseContext, matcher: IFileMatcher) {
  if (matcher.fileId) {
    const file = await context.data.file.getOneByQuery(EndpointReusableQueries.getById(matcher.fileId));

    return file;
  } else if (matcher.filepath) {
    const pathWithDetails = splitfilepathWithDetails(matcher.filepath);
    const workspace = await context.data.workspace.getOneByQuery(
      WorkspaceQueries.getByRootname(pathWithDetails.workspaceRootname)
    );
    assertWorkspace(workspace);
    const file = await context.data.file.getOneByQuery(
      pathWithDetails.extension
        ? FileQueries.getByNamePathAndExtention(
            workspace.resourceId,
            pathWithDetails.splitPathWithoutExtension,
            pathWithDetails.extension
          )
        : FileQueries.getByNamePath(workspace.resourceId, pathWithDetails.splitPathWithoutExtension)
    );

    return file;
  }

  return null;
}

export async function assertGetSingleFileWithMatcher(context: IBaseContext, matcher: IFileMatcher): Promise<IFile> {
  const file = await getFileWithMatcher(context, matcher);
  assertFile(file);
  return file;
}
