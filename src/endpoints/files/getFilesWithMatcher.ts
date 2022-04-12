import {first} from 'lodash';
import {format} from 'util';
import {IFile, IFileMatcher} from '../../definitions/file';
import {IBaseContext} from '../contexts/BaseContext';
import {InvalidRequestError, NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import FileQueries from './queries';
import {getFileName, splitfilepathWithDetails} from './utils';

export async function getFilesWithMatcher(
  context: IBaseContext,
  matcher: IFileMatcher,
  count?: number
) {
  if (matcher.fileId) {
    const file = await context.data.file.getItem(
      EndpointReusableQueries.getById(matcher.fileId)
    );

    return [file];
  } else if (matcher.filepath && matcher.workspaceId) {
    const pathWithDetails = splitfilepathWithDetails(matcher.filepath);
    const files = await context.data.file.getManyItems(
      pathWithDetails.extension
        ? FileQueries.getByNamePathAndExtention(
            matcher.workspaceId,
            pathWithDetails.splitPathWithoutExtension,
            pathWithDetails.extension
          )
        : FileQueries.getByNamePath(
            matcher.workspaceId,
            pathWithDetails.splitPathWithoutExtension
          )
    );

    if (count && files.length > count) {
      const message = format(
        'Multiple files found matching request %o',
        files.map(file => getFileName(file))
      );

      throw new InvalidRequestError(message);
    }

    return files;
  }

  return [];
}

export async function assertGetFilesWithMatcher(
  context: IBaseContext,
  matcher: IFileMatcher,
  count?: number
) {
  const files = await getFilesWithMatcher(context, matcher, count);

  if (files.length === 0) {
    throw new NotFoundError('File not found');
  }

  return files;
}

export async function assertGetSingleFileWithMatcher(
  context: IBaseContext,
  matcher: IFileMatcher
): Promise<IFile> {
  const files = await getFilesWithMatcher(context, matcher, 1);
  const file = first(files);

  if (!file) {
    throw new NotFoundError('File not found');
  }

  return file;
}
