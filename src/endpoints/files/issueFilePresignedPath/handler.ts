import {File, FilePresignedPath} from '../../../definitions/file';
import {AppResourceTypeMap, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {getClosestExistingFolder} from '../../folders/getFolderWithMatcher';
import {assertWorkspace} from '../../workspaces/utils';
import {getFileWithMatcher} from '../getFilesWithMatcher';
import {checkFileAuthorization, getFilepathInfo} from '../utils';
import {IssueFilePresignedPathEndpoint} from './types';
import {issueFilePresignedPathJoiSchema} from './validation';

const issueFilePresignedPath: IssueFilePresignedPathEndpoint = async instData => {
  const data = validate(instData.data, issueFilePresignedPathJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);

  const resource = await await kSemanticModels.utils().withTxn(async opts => {
    let file: File | null = null;
    let workspace: Workspace | undefined | null = undefined;

    file = await getFileWithMatcher(data, opts);

    let namepath: string[] | undefined = undefined;
    let extension: string | undefined = undefined;
    let fileId: string | undefined = undefined;

    if (file) {
      // Happy path. If there's a file, get the name path and extension
      ({namepath, extension, resourceId: fileId} = file);
      await checkFileAuthorization(agent, file, 'readFile');
    } else {
      // File doesn't exist but we're generating presigned path for the filepath.
      // Presigned paths for non-existing files will work just like filepaths for
      // files that don't exist, it'll return 404.

      // Assert filepath is provided cause otherwise, we can't generate presigned
      // path.
      appAssert(data.filepath, kReuseableErrors.file.provideNamepath());
      const pathinfo = getFilepathInfo(data.filepath);
      ({namepath, extension} = pathinfo);

      if (!workspace) {
        workspace = await kSemanticModels
          .workspace()
          .getByRootname(pathinfo.rootname, opts);
      }

      assertWorkspace(workspace);

      // Get closest existing folder for permission check.
      const {closestFolder} = await getClosestExistingFolder(
        workspace.resourceId,
        pathinfo.parentNamepath,
        opts
      );
      await checkAuthorizationWithAgent({
        agent,
        workspace,
        opts,
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

    const presignedPath = newWorkspaceResource<FilePresignedPath>(
      agent,
      AppResourceTypeMap.FilePresignedPath,
      workspace.resourceId,
      {
        expiresAt,
        fileId,
        filepath: namepath,
        extension: extension,
        action: ['readFile'],
        agentTokenId: agent.agentTokenId,
        usageCount: data.usageCount,
        spentUsageCount: 0,
      }
    );
    await kSemanticModels.filePresignedPath().insertItem(presignedPath, opts);

    return presignedPath;
  });

  return {path: resource.resourceId};
};

export default issueFilePresignedPath;
