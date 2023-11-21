import {File, FilePresignedPath} from '../../../definitions/file';
import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource} from '../../../utils/resource';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {InvalidRequestError} from '../../errors';
import {getClosestExistingFolder} from '../../folders/getFolderWithMatcher';
import {assertWorkspace} from '../../workspaces/utils';
import {getFileWithFilepath, getFileWithId} from '../getFilesWithMatcher';
import {checkFileAuthorization, getFilepathInfo} from '../utils';
import {IssueFilePresignedPathEndpoint} from './types';
import {issueFilePresignedPathJoiSchema} from './validation';

const issueFilePresignedPath: IssueFilePresignedPathEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, issueFilePresignedPathJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);

  let file: File | null = null;
  let workspace: Workspace | undefined | null = undefined;

  // Attempt to fetch file by file ID or filepath, the file doesn't need to
  // exist yet
  if (data.filepath) {
    ({file, workspace} = await getFileWithFilepath(context, data.filepath));
  } else if (data.fileId) {
    ({file} = await getFileWithId(context, data.fileId));

    if (file) {
      workspace = await context.semantic.workspace.assertGetOneByQuery({
        resourceId: file?.workspaceId,
      });
    }
  } else {
    throw new InvalidRequestError('File ID or filepath not provided.');
  }

  let fileNamePath: string[] | undefined = undefined;
  let fileExtension: string | undefined = undefined;

  if (file) {
    // Happy path. If there's a file, get the name path and extension
    fileNamePath = file.namePath;
    fileExtension = file.extension;
    await checkFileAuthorization(context, agent, file, 'readFile');
  } else {
    // File doesn't exist but we're generating presigned path for the filepath.
    // Presigned paths for non-existing files will work just like filepaths for
    // files that don't exist, it'll return 404.

    // Assert filepath is provided cause otherwise, we can't generate presigned
    // path.
    appAssert(data.filepath, reuseableErrors.file.notFound(data.fileId));
    const filepathInfo = getFilepathInfo(data.filepath);
    fileNamePath = filepathInfo.splitPathWithoutExtension;
    fileExtension = filepathInfo.extension;

    if (!workspace) {
      workspace = await context.semantic.workspace.getByRootname(
        filepathInfo.workspaceRootname
      );
    }

    assertWorkspace(workspace);

    // Get closest existing folder for permission check.
    const {closestFolder} = await getClosestExistingFolder(
      context,
      workspace.resourceId,
      filepathInfo.splitParentPath
    );
    await checkAuthorizationWithAgent({
      context,
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {
        targetId: getResourcePermissionContainers(
          workspace.resourceId,
          closestFolder,
          /** include resource ID */ true
        ),
        action: 'readFile',
      },
    });
  }

  assertWorkspace(workspace);
  let expiresAt = data.expires;

  if (!expiresAt && data.duration) {
    expiresAt = Date.now() + data.duration;
  }

  const resource = newWorkspaceResource<FilePresignedPath>(
    agent,
    AppResourceTypeMap.FilePresignedPath,
    workspace.resourceId,
    {
      expiresAt,
      fileNamePath,
      fileExtension,
      action: ['readFile'],
      agentTokenId: agent.agentTokenId,
      usageCount: data.usageCount,
      spentUsageCount: 0,
    }
  );
  await context.semantic.utils.withTxn(context, async opts => {
    await context.semantic.filePresignedPath.insertItem(resource, opts);
  });

  return {path: resource.resourceId};
};

export default issueFilePresignedPath;
