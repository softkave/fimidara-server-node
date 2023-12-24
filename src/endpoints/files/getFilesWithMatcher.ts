import {File, FileMatcher, FilePresignedPath} from '../../definitions/file';
import {PermissionAction} from '../../definitions/permissionItem';
import {kAppResourceType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../../utils/sessionUtils';
import {kSemanticModels} from '../contexts/injectables';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {kFolderConstants} from '../folders/constants';
import {PermissionDeniedError} from '../users/errors';
import {assertFile, checkFileAuthorization, readOrIngestFileByFilepath} from './utils';

export async function checkAndIncrementFilePresignedPathUsageCount(
  presignedPath: FilePresignedPath
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    if (
      presignedPath.usageCount &&
      presignedPath.usageCount <= presignedPath.spentUsageCount
    ) {
      // TODO: should we use a different error type?
      throw new PermissionDeniedError();
    }

    const updatedPresignedPath = await kSemanticModels
      .filePresignedPath()
      .getAndUpdateOneById(
        presignedPath.resourceId,
        {spentUsageCount: presignedPath.spentUsageCount + 1},
        opts
      );
    assertFile(updatedPresignedPath);

    return updatedPresignedPath;
  });
}

export function extractFilePresignedPathIdFromFilepath(filepath: string) {
  return filepath.startsWith(kFolderConstants.separator) ? filepath.slice(1) : filepath;
}

export function isFilePresignedPath(filepath: string) {
  const resourceId = extractFilePresignedPathIdFromFilepath(filepath);
  const type = tryGetResourceTypeFromId(resourceId);
  return type === kAppResourceType.FilePresignedPath;
}

export async function getFileByPresignedPath(
  filepath: string,
  action: PermissionAction,
  incrementUsageCount = false,
  opts?: SemanticProviderRunOptions
) {
  if (!isFilePresignedPath(filepath)) {
    return null;
  }

  const resourceId = extractFilePresignedPathIdFromFilepath(filepath);
  let presignedPath = await kSemanticModels
    .filePresignedPath()
    .assertGetOneByQuery({resourceId}, opts);
  const now = Date.now();

  if (presignedPath.expiresAt && presignedPath.expiresAt < now) {
    // TODO: should we use a different error type?
    throw new PermissionDeniedError();
  }

  appAssert(presignedPath.action.includes(action), new PermissionDeniedError());

  if (incrementUsageCount) {
    presignedPath = await checkAndIncrementFilePresignedPathUsageCount(presignedPath);
  }

  const file = await kSemanticModels.file().getOneByNamepath(
    {
      workspaceId: presignedPath.workspaceId,
      namepath: presignedPath.filepath,
      extension: presignedPath.extension,
    },
    opts
  );
  assertFile(file);

  // Check agent token exists, and that agent still has access to file. This is
  // critical and allows us to have a one-size-fits-all solution for the many
  // ways permissions could change. For example, when a collaborator is removed,
  // when the agent token's permissions are updated, when the agent token is
  // deleted, etc. We don't need to explicitly handle invalidating presigned
  // paths through these multiple surface areas seeing we can just simply check
  // if the issuing agent token exists and still has permission.
  const agentToken = await kSemanticModels
    .agentToken()
    .assertGetOneByQuery({resourceId: presignedPath.agentTokenId}, opts);

  await checkFileAuthorization(
    agentToken
      ? makeUserSessionAgent(
          // TODO: how can we reduce all the db fetches in this function
          await kSemanticModels.user().assertGetOneByQuery({
            resourceId: agentToken.separateEntityId,
          }),
          agentToken
        )
      : makeWorkspaceAgentTokenAgent(agentToken),
    file,
    action,
    opts
  );
  return {presignedPath, file};
}

export async function getFileWithMatcher(
  matcher: FileMatcher,
  opts: SemanticProviderMutationRunOptions,
  workspaceId?: string
): Promise<File | null> {
  if (matcher.fileId) {
    return await kSemanticModels.file().getOneById(matcher.fileId, opts);
  } else if (matcher.filepath) {
    return await readOrIngestFileByFilepath(matcher.filepath, opts, workspaceId);
  }

  return null;
}
