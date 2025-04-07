import {isNumber} from 'lodash-es';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
  SemanticProviderQueryParams,
} from '../../contexts/semantic/types.js';
import {File, FileMatcher} from '../../definitions/file.js';
import {
  FimidaraPermissionAction,
  kFimidaraPermissionActions,
} from '../../definitions/permissionItem.js';
import {PresignedPath} from '../../definitions/presignedPath.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {appAssert} from '../../utils/assertion.js';
import {tryGetResourceTypeFromId} from '../../utils/resource.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../../utils/sessionUtils.js';
import {NotFoundError} from '../errors.js';
import {kFolderConstants} from '../folders/constants.js';
import {PermissionDeniedError} from '../users/errors.js';
import {
  assertFile,
  checkFileAuthorization,
  getFilepathInfo,
  getWorkspaceFromFilepath,
  ingestFileByFilepath,
} from './utils.js';

export async function checkAndIncrementPresignedPathUsageCount(
  presignedPath: PresignedPath,
  opts: SemanticProviderMutationParams
) {
  if (
    isNumber(presignedPath.maxUsageCount) &&
    presignedPath.maxUsageCount <= presignedPath.spentUsageCount
  ) {
    // TODO: should we use a different error type?
    throw kReuseableErrors.file.notFound();
  }

  const updatedPresignedPath = await kIjxSemantic
    .presignedPath()
    .getAndUpdateOneById(
      presignedPath.resourceId,
      {spentUsageCount: presignedPath.spentUsageCount + 1},
      opts
    );

  assertFile(updatedPresignedPath);
  return updatedPresignedPath;
}

export function extractPresignedPathIdFromFilepath(filepath: string) {
  return filepath.startsWith(kFolderConstants.separator)
    ? filepath.slice(1)
    : filepath;
}

export function isPresignedPath(filepath: string) {
  const resourceId = extractPresignedPathIdFromFilepath(filepath);
  const type = tryGetResourceTypeFromId(resourceId);
  return type === kFimidaraResourceType.PresignedPath;
}

export async function getPresignedPath(props: {
  filepath: string;
  opts?: SemanticProviderOpParams;
}) {
  const {filepath, opts} = props;
  if (!isPresignedPath(filepath)) {
    return {};
  }

  const resourceId = extractPresignedPathIdFromFilepath(filepath);
  const presignedPath = await kIjxSemantic
    .presignedPath()
    .getOneById(resourceId, opts);

  appAssert(presignedPath, new NotFoundError('Presigned path not found.'));
  return {presignedPath};
}

export async function getFileByPresignedPath(props: {
  filepath: string;
  action: FimidaraPermissionAction;
  incrementUsageCount: boolean;
  opts: SemanticProviderMutationParams & SemanticProviderQueryParams<File>;
}) {
  const {filepath, action, incrementUsageCount, opts} = props;
  let {presignedPath} = await getPresignedPath({filepath, opts});
  if (!presignedPath) {
    return {};
  }

  const now = Date.now();
  if (presignedPath.expiresAt && presignedPath.expiresAt < now) {
    // TODO: should we use a different error type?
    throw kReuseableErrors.file.notFound();
  }

  appAssert(
    presignedPath.actions.includes(action),
    new PermissionDeniedError()
  );

  if (incrementUsageCount) {
    presignedPath = await checkAndIncrementPresignedPathUsageCount(
      presignedPath,
      opts
    );
  }

  const file = await kIjxSemantic.file().getOneByNamepath(
    {
      workspaceId: presignedPath.workspaceId,
      namepath: presignedPath.namepath,
      ext: presignedPath.ext,
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
  const agentToken = await kIjxSemantic
    .agentToken()
    .assertGetOneByQuery({resourceId: presignedPath.issuerAgentTokenId}, opts);

  const {workspace} = await checkFileAuthorization(
    agentToken.entityType === kFimidaraResourceType.User
      ? makeUserSessionAgent(
          // TODO: how can we reduce all the db fetches in this function
          await kIjxSemantic.user().assertGetOneByQuery({
            resourceId: agentToken.forEntityId,
          }),
          agentToken
        )
      : makeWorkspaceAgentTokenAgent(agentToken),
    file,
    action,
    opts
  );

  return {presignedPath, file, isPresignedPath: true, workspace};
}

export async function getFileByFilepath(props: {
  /** filepath with ext if present, and workspace rootname. */
  filepath: string;
  opts?: SemanticProviderOpParams;
  workspaceId?: string;
}) {
  const fileModel = kIjxSemantic.file();
  const {filepath, opts} = props;
  let {workspaceId} = props;
  let workspace: Workspace | undefined;

  if (!workspaceId) {
    const {workspace} = await getWorkspaceFromFilepath(filepath);
    workspaceId = workspace.resourceId;
  }

  const pathinfo = getFilepathInfo(filepath, {
    allowRootFolder: false,
    containsRootname: true,
  });

  const file = await fileModel.getOneByNamepath(
    {workspaceId, namepath: pathinfo.namepath},
    opts
  );

  return {file, workspace};
}

export async function getFileWithMatcher(props: {
  matcher: FileMatcher;
  opts: SemanticProviderMutationParams;
  /** Defaults to `readFile`. */
  presignedPathAction?: FimidaraPermissionAction;
  workspaceId?: string;
  /** Defaults to `true`. */
  supportPresignedPath?: boolean;
  /** Defaults to `true`. */
  incrementPresignedPathUsageCount?: boolean;
  shouldIngestFile?: boolean;
}): Promise<{
  file?: File | null;
  presignedPath?: PresignedPath;
  workspace?: Workspace;
}> {
  const {
    matcher,
    opts,
    workspaceId,
    supportPresignedPath = true,
    incrementPresignedPathUsageCount = true,
    shouldIngestFile = true,
    presignedPathAction = kFimidaraPermissionActions.readFile,
  } = props;

  if (matcher.fileId) {
    const file = await kIjxSemantic.file().getOneById(matcher.fileId, opts);
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

    if (shouldIngestFile) {
      // Try ingesting file if not in DB
      await ingestFileByFilepath({
        opts,
        agent: kSystemSessionAgent,
        fimidaraFilepath: matcher.filepath,
      });

      // Try again to get file from DB
      getByFilepathResult = await getFileByFilepath({
        opts,
        workspaceId,
        filepath: matcher.filepath,
      });
    }

    return getByFilepathResult;
  }

  return {};
}
