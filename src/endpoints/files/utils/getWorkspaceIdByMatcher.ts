import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {FileMatcher} from '../../../definitions/file.js';
import {appAssert} from '../../../utils/assertion.js';
import {NotFoundError} from '../../errors.js';
import {getPresignedPath} from '../getFilesWithMatcher.js';
import {getWorkspaceFromFilepath} from '../utils.js';

export async function getWorkspaceIdByMatcher(matcher: FileMatcher) {
  if (matcher.fileId) {
    const file = await kIjxSemantic.file().getOneById(matcher.fileId);
    appAssert(file, new NotFoundError('File not found.'));
    return file.workspaceId;
  } else if (matcher.filepath) {
    const {presignedPath} = await getPresignedPath({
      filepath: matcher.filepath,
    });

    if (presignedPath) {
      return presignedPath.workspaceId;
    }

    const {workspace} = await getWorkspaceFromFilepath(matcher.filepath);
    return workspace.resourceId;
  }

  throw new Error('Invalid matcher');
}
