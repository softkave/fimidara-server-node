import {File, FileMatcher, FilePresignedPath} from '../../definitions/file';
import {PermissionAction} from '../../definitions/permissionItem';
import {AppResourceType} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {appAssert} from '../../utils/assertion';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../../utils/sessionUtils';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {folderConstants} from '../folders/constants';
import {PermissionDeniedError} from '../users/errors';
import {assertWorkspace} from '../workspaces/utils';
import {assertFile, checkFileAuthorization, getFilepathInfo} from './utils';

export async function checkAndIncrementFilePresignedPathUsageCount(
  context: BaseContextType,
  presignedPath: FilePresignedPath,
  opts?: SemanticDataAccessProviderRunOptions
) {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      if (
        presignedPath.usageCount &&
        presignedPath.usageCount <= presignedPath.spentUsageCount
      ) {
        // TODO: should we use a different error type?
        throw new PermissionDeniedError();
      }

      const updatedPresignedPath =
        await context.semantic.filePresignedPath.getAndUpdateOneById(
          presignedPath.resourceId,
          {spentUsageCount: presignedPath.spentUsageCount + 1},
          opts
        );
      assertFile(updatedPresignedPath);
      return updatedPresignedPath;
    },
    opts
  );
}

export function extractFilePresignedPathIdFromFilepath(filepath: string) {
  return filepath.startsWith(folderConstants.nameSeparator)
    ? filepath.slice(1)
    : filepath;
}

export function isFilePresignedPath(filepath: string) {
  const resourceId = extractFilePresignedPathIdFromFilepath(filepath);
  const type = tryGetResourceTypeFromId(resourceId);
  return type === AppResourceType.FilePresignedPath;
}

export async function getFileByPresignedPath(
  context: BaseContextType,
  filepath: string,
  action: PermissionAction,
  incrementUsageCount = false,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (!isFilePresignedPath(filepath)) {
    return null;
  }

  const resourceId = extractFilePresignedPathIdFromFilepath(filepath);
  let presignedPath = await context.semantic.filePresignedPath.assertGetOneByQuery(
    {resourceId},
    opts
  );
  const now = Date.now();

  if (presignedPath.expiresAt && presignedPath.expiresAt < now) {
    // TODO: should we use a different error type?
    throw new PermissionDeniedError();
  }

  appAssert(presignedPath.action.includes(action), new PermissionDeniedError());

  if (incrementUsageCount) {
    presignedPath = await checkAndIncrementFilePresignedPathUsageCount(
      context,
      presignedPath,
      opts
    );
  }

  const file = await context.semantic.file.getOneByNamePath(
    presignedPath.workspaceId,
    presignedPath.fileNamePath,
    presignedPath.fileExtension,
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
  const agentToken = await context.semantic.agentToken.assertGetOneByQuery(
    {resourceId: presignedPath.agentTokenId},
    opts
  );
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
    action,
    opts
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
    pathWithDetails.workspaceRootname,
    opts
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
  // if (
  //   matcher.filepath &&
  //   !matcher.fileId &&
  //   tryGetResourceTypeFromId(matcher.filepath) === AppResourceType.File
  // ) {
  //   matcher.fileId = matcher.filepath;
  //   matcher.filepath = undefined;
  // }

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
