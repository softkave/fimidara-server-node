import {isNumber} from 'lodash';
import {File, FileMatcher, FilePresignedPath} from '../../definitions/file';
import {PermissionAction, kPermissionsMap} from '../../definitions/permissionItem';
import {kAppResourceType} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {kSystemSessionAgent} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {tryGetResourceTypeFromId} from '../../utils/resource';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../../utils/sessionUtils';
import {kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {kFolderConstants} from '../folders/constants';
import {PermissionDeniedError} from '../users/errors';
import {
  assertFile,
  checkFileAuthorization,
  getFilepathInfo,
  getWorkspaceFromFilepath,
  ingestFileByFilepath,
} from './utils';

export async function checkAndIncrementFilePresignedPathUsageCount(
  presignedPath: FilePresignedPath
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    if (
      isNumber(presignedPath.maxUsageCount) &&
      presignedPath.maxUsageCount <= presignedPath.spentUsageCount
    ) {
      // TODO: should we use a different error type?
      throw kReuseableErrors.file.notFound();
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

export async function getFileByPresignedPath(props: {
  filepath: string;
  action: PermissionAction;
  incrementUsageCount: boolean;
  opts?: SemanticProviderRunOptions;
}) {
  const {filepath, action, incrementUsageCount, opts} = props;

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
    throw kReuseableErrors.file.notFound();
  }

  appAssert(presignedPath.actions.includes(action), new PermissionDeniedError());

  if (incrementUsageCount) {
    presignedPath = await checkAndIncrementFilePresignedPathUsageCount(presignedPath);
  }

  const file = await kSemanticModels.file().getOneByNamepath(
    {
      workspaceId: presignedPath.workspaceId,
      namepath: presignedPath.namepath,
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
    .assertGetOneByQuery({resourceId: presignedPath.issuerAgentTokenId}, opts);

  await checkFileAuthorization(
    agentToken
      ? makeUserSessionAgent(
          // TODO: how can we reduce all the db fetches in this function
          await kSemanticModels.user().assertGetOneByQuery({
            resourceId: agentToken.forEntityId,
          }),
          agentToken
        )
      : makeWorkspaceAgentTokenAgent(agentToken),
    file,
    action,
    opts
  );

  return {presignedPath, file, isPresignedPath: true};
}

export async function getFileByFilepath(props: {
  /** filepath with extension if present, and workspace rootname. */
  filepath: string;
  opts: SemanticProviderMutationRunOptions;
  workspaceId?: string;
}) {
  const fileModel = kSemanticModels.file();
  const {filepath, opts} = props;
  let {workspaceId} = props;
  let workspace: Workspace | undefined;

  if (!workspaceId) {
    workspace = await getWorkspaceFromFilepath(filepath);
    workspaceId = workspace.resourceId;
  }

  const pathinfo = getFilepathInfo(filepath);
  const file = await fileModel.getOneByNamepath(
    {workspaceId, namepath: pathinfo.namepath},
    opts
  );

  return {file, workspace};
}

export async function getFileWithMatcher(props: {
  matcher: FileMatcher;
  opts: SemanticProviderMutationRunOptions;
  /** Defaults to `readFile`. */
  presignedPathAction?: PermissionAction;
  workspaceId?: string;
  /** Defaults to `true`. */
  supportPresignedPath?: boolean;
  /** Defaults to `true`. */
  incrementPresignedPathUsageCount?: boolean;
}): Promise<{file?: File | null; presignedPath?: FilePresignedPath}> {
  const {
    matcher,
    opts,
    workspaceId,
    supportPresignedPath = true,
    incrementPresignedPathUsageCount = true,
    presignedPathAction = kPermissionsMap.readFile,
  } = props;

  if (matcher.fileId) {
    const file = await kSemanticModels.file().getOneById(matcher.fileId, opts);
    return {file};
  } else if (matcher.filepath) {
    if (supportPresignedPath) {
      // Try getting file by presigned path
      const getByPresignedPathResult = await getFileByPresignedPath({
        opts,
        action: presignedPathAction,
        filepath: matcher.filepath,
        incrementUsageCount: incrementPresignedPathUsageCount,
      });

      if (getByPresignedPathResult?.isPresignedPath) {
        return getByPresignedPathResult;
      }
    }

    // Try getting file from DB by filepath
    let getByFilepathResult = await getFileByFilepath({
      opts,
      workspaceId,
      filepath: matcher.filepath,
    });

    if (getByFilepathResult.file) {
      return getByFilepathResult;
    }

    // Try ingesting file if not in DB
    await ingestFileByFilepath({
      opts,
      agent: kSystemSessionAgent,
      filepath: matcher.filepath,
    });

    // Try again to get file from DB
    getByFilepathResult = await getFileByFilepath({
      opts,
      workspaceId,
      filepath: matcher.filepath,
    });

    return getByFilepathResult;
  }

  return {};
}
