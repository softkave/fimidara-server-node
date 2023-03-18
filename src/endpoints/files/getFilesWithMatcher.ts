import {IFile, IFileMatcher} from '../../definitions/file';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {assertWorkspace} from '../workspaces/utils';
import {assertFile, splitfilepathWithDetails} from './utils';

export async function getFileWithMatcher(
  context: IBaseContext,
  matcher: IFileMatcher,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  if (matcher.fileId) {
    const file = await context.semantic.file.getOneById(matcher.fileId, opts);
    assertFile(file);
    return file;
  } else if (matcher.filepath) {
    const pathWithDetails = splitfilepathWithDetails(matcher.filepath);
    const workspace = await context.semantic.workspace.getByRootname(
      pathWithDetails.workspaceRootname
    );
    assertWorkspace(workspace);
    const file = await context.semantic.file.getOneByNamePath(
      workspace.resourceId,
      pathWithDetails.splitPathWithoutExtension,
      pathWithDetails.extension,
      opts
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
