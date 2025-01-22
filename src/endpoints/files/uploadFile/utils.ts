import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {FileMatcher} from '../../../definitions/file.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getFileWithMatcher} from '../getFilesWithMatcher.js';

export async function tryGetFile(
  data: FileMatcher & {workspaceId?: string},
  opts: SemanticProviderMutationParams
) {
  const matched = await getFileWithMatcher({
    opts,
    presignedPathAction: kFimidaraPermissionActions.uploadFile,
    incrementPresignedPathUsageCount: true,
    supportPresignedPath: true,
    matcher: data,
    workspaceId: data.workspaceId,
  });

  return matched;
}
