import {File, FileMatcher} from '../../definitions/file';
import {AppActionType, AppResourceType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {makeUserSessionAgent, makeWorkspaceAgentTokenAgent} from '../../utils/sessionUtils';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../contexts/semantic/utils';
import {BaseContextType} from '../contexts/types';
import {PermissionDeniedError} from '../users/errors';
import {assertWorkspace} from '../workspaces/utils';
import {assertFile, checkFileAuthorization, splitFilepathWithDetails} from './utils';

export async function getCheckAndIncrementFilePresignedPathUsageCount(
  context: BaseContextType,
  resourceId: string,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  return await executeWithMutationRunOptions(
    context,
    async opts => {
      const presignedPath = await context.semantic.filePresignedPath.assertGetOneByQuery(
        {resourceId},
        opts
      );

      if (presignedPath.usageCount && presignedPath.usageCount <= presignedPath.spentUsageCount)
        // TODO: should we use a different error type?
        throw new PermissionDeniedError();

      // TODO: possible race condition here, seeing the check above is not using
      // data fetched with the update txn
      const updatedResource = await context.semantic.filePresignedPath.updateOneById(
        presignedPath.resourceId,
        {spentUsageCount: presignedPath.spentUsageCount + 1},
        opts
      );
      assertFile(updatedResource);
      return updatedResource;
    },
    opts
  );
}

export async function getFileByPresignedPath(
  context: BaseContextType,
  resourceId: string,
  action: AppActionType
) {
  if (tryGetResourceTypeFromId(resourceId) !== AppResourceType.FilePresignedPath) return null;

  const presignedPath = await getCheckAndIncrementFilePresignedPathUsageCount(context, resourceId);
  const now = Date.now();

  if (presignedPath.expiresAt && presignedPath.expiresAt < now) {
    // TODO: should we use a different error type?
    throw new PermissionDeniedError();
  }

  appAssert(presignedPath.action.includes(action), new PermissionDeniedError());
  const file = await context.semantic.file.assertGetOneByQuery({resourceId: presignedPath.fileId});

  // Check agent token exists, and that agent still has access to file. This is
  // critical and allows us to have a one-size-fits-all solution for the many
  // ways permissions could change. For example, when a collaborator is removed,
  // when the agent token's permissions are updated, when the agent token is
  // deleted, etc. We don't need to explicitly handle invalidating presigned
  // paths through these multiple surface areas seeing we can just simply check
  // if the issuing agent token exists and still has permission.
  const agentToken = await context.semantic.agentToken.assertGetOneByQuery({
    resourceId: presignedPath.agentTokenId,
  });
  await checkFileAuthorization(
    context,
    agentToken
      ? makeUserSessionAgent(
          // TODO: how can we reduce all the db fetches in this function
          await context.semantic.user.assertGetOneByQuery({
            resourceId: agentToken.separateEntityId,
          }),
          agentToken
        )
      : makeWorkspaceAgentTokenAgent(agentToken),
    file,
    action
  );
  return {presignedPath, file};
}

export async function getFileWithMatcher(
  context: BaseContextType,
  matcher: FileMatcher,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (matcher.fileId) {
    const file = await context.semantic.file.getOneById(matcher.fileId, opts);
    assertFile(file);
    return file;
  } else if (matcher.filepath) {
    const pathWithDetails = splitFilepathWithDetails(matcher.filepath);
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
  context: BaseContextType,
  matcher: FileMatcher,
  opts?: SemanticDataAccessProviderRunOptions
): Promise<File> {
  const file = await getFileWithMatcher(context, matcher, opts);
  assertFile(file);
  return file;
}
