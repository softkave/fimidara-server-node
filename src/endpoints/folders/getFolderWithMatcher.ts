import {IFolderMatcher} from '../../definitions/folder';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import FolderQueries from './queries';
import {assertSplitFolderPath} from './utils';

export async function getFolderWithMatcher(
  context: IBaseContext,
  matcher: IFolderMatcher
) {
  if (matcher.folderId) {
    return await context.data.folder.getItem(
      EndpointReusableQueries.getById(matcher.folderId)
    );
  } else if (matcher.folderPath && matcher.organizationId) {
    const splitPath = assertSplitFolderPath(matcher.folderPath);
    const folder = await context.data.folder.assertGetItem(
      FolderQueries.getByNamePath(matcher.organizationId, splitPath)
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

  if (!folder) {
    throw new NotFoundError('Folder does not exist');
  }

  return folder;
}
