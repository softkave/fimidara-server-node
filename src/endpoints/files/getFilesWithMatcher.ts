import {File, FileMatcher} from '../../definitions/file';
import {AppActionType, AppResourceType} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {makeUserSessionAgent, makeWorkspaceAgentTokenAgent} from '../../utils/sessionUtils';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {folderConstants} from '../folders/constants';
import {PermissionDeniedError} from '../users/errors';
import {assertWorkspace} from '../workspaces/utils';
import {assertFile, checkFileAuthorization, getFilepathInfo} from './utils';

async function getCheckAndIncrementFilePresignedPathUsageCount(
  context: BaseContextType,
  resourceId: string,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      const presignedPath = await context.semantic.filePresignedPath.assertGetOneByQuery(
        {resourceId},
        opts
      );

      if (presignedPath.usageCount && presignedPath.usageCount <= presignedPath.spentUsageCount)
        // TODO: should we use a different error type?
        throw new PermissionDeniedError();

      // TODO: possible race condition here, read and update should occur in the
      // same op
      const updatedFile = await context.semantic.filePresignedPath.getAndUpdateOneById(
        presignedPath.resourceId,
        {spentUsageCount: presignedPath.spentUsageCount + 1},
        opts
      );
      assertFile(updatedFile);
      return updatedFile;
    },
    opts
  );
}

export async function getFileByPresignedPath(
  context: BaseContextType,
  filepath: string,
  action: AppActionType
) {
  const resourceId = filepath.startsWith(folderConstants.nameSeparator)
    ? filepath.slice(1)
    : filepath;
  const type = tryGetResourceTypeFromId(resourceId);

  if (type !== AppResourceType.FilePresignedPath) {
    return null;
  }

  const presignedPath = await getCheckAndIncrementFilePresignedPathUsageCount(context, resourceId);
  const now = Date.now();

  if (presignedPath.expiresAt && presignedPath.expiresAt < now) {
    // TODO: should we use a different error type?
    throw new PermissionDeniedError();
  }

  appAssert(presignedPath.action.includes(action), new PermissionDeniedError());
  const file = await context.semantic.file.getOneByNamePath(
    presignedPath.workspaceId,
    presignedPath.fileNamePath,
    presignedPath.fileExtension
  );
  assertFile(file);

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

export async function getFileWithId(
  context: BaseContextType,
  fileId: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const file = await context.semantic.file.getOneById(fileId, opts);
  return {file};
}

export async function getFileWithFilepath(
  context: BaseContextType,
  filepath: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const pathWithDetails = getFilepathInfo(filepath);
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

  return {file, workspace};
}

export async function getFileWithMatcher(
  context: BaseContextType,
  matcher: FileMatcher,
  opts?: SemanticDataAccessProviderRunOptions
): Promise<{file?: File | null; workspace?: Workspace}> {
  if (matcher.fileId) {
    return await getFileWithId(context, matcher.fileId, opts);
  } else if (matcher.filepath) {
    return await getFileWithFilepath(context, matcher.filepath, opts);
  }

  return {};
}

export async function assertGetSingleFileWithMatcher(
  context: BaseContextType,
  matcher: FileMatcher,
  opts?: SemanticDataAccessProviderRunOptions
): Promise<File> {
  const {file} = await getFileWithMatcher(context, matcher, opts);
  assertFile(file);
  return file;
}
