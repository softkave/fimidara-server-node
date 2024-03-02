import {kPermissionsMap} from '../../../definitions/permissionItem';
import {PresignedPath} from '../../../definitions/presignedPath';
import {
  Resource,
  kAppResourceType,
  kPermissionAgentTypes,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {convertToArray} from '../../../utils/fns';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getFileWithMatcher} from '../../files/getFilesWithMatcher';
import {getFilepathInfo} from '../../files/utils';
import {getClosestExistingFolder} from '../../folders/getFolderWithMatcher';
import {assertRootname, assertWorkspace} from '../../workspaces/utils';
import {IssuePresignedPathEndpoint} from './types';
import {issuePresignedPathJoiSchema} from './validation';

const issuePresignedPath: IssuePresignedPathEndpoint = async instData => {
  const data = validate(instData.data, issuePresignedPathJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const actions = data.action || [kPermissionsMap.readFile];

  const resource = await await kSemanticModels.utils().withTxn(async opts => {
    const {file} = await getFileWithMatcher({
      opts,
      matcher: data,
      incrementPresignedPathUsageCount: true,
      supportPresignedPath: true,
    });
    let workspace: Workspace | undefined | null = undefined,
      namepath: string[],
      extension: string | undefined,
      fileId: string | undefined,
      permissionTarget: Resource,
      workspaceId: string;

    if (file) {
      // Happy path. Extract necessary data and continue.
      ({namepath, extension, workspaceId, resourceId: fileId} = file);
      permissionTarget = file;
    } else if (data.fileId) {
      // Throw error if there's no file, and we're provided a fileId
      throw kReuseableErrors.file.notFound();
    } else {
      // File doesn't exist but we're generating presigned path for the
      // filepath. Presigned paths for non-existing files should work just like
      // filepaths for files that don't exist, it should return 404.

      // Assert filepath is provided cause otherwise, we can't generate presigned
      // path without one.
      appAssert(data.filepath, kReuseableErrors.file.provideNamepath());
      const pathinfo = getFilepathInfo(data.filepath);
      ({namepath, extension} = pathinfo);

      assertRootname(pathinfo.rootname);
      workspace = await kSemanticModels
        .workspace()
        .getByRootname(pathinfo.rootname, opts);
      assertWorkspace(workspace);

      // Get closest existing folder for permission check.
      const {closestFolder} = await getClosestExistingFolder(
        workspace.resourceId,
        pathinfo.parentNamepath,
        opts
      );
      permissionTarget = closestFolder || workspace;
      workspaceId = workspace.resourceId;
    }

    // Check issuer has permission for requested actions/permissions
    await Promise.all(
      convertToArray(actions).map(action =>
        checkAuthorizationWithAgent({
          agent,
          opts,
          workspaceId,
          workspace: workspace || undefined,
          target: {
            action,
            targetId: getResourcePermissionContainers(
              workspaceId,
              permissionTarget,
              /** include resource ID */ true
            ),
          },
        })
      )
    );

    let expiresAt = data.expires;

    if (!expiresAt && data.duration) {
      expiresAt = Date.now() + data.duration;
    }

    const presignedPath = newWorkspaceResource<PresignedPath>(
      agent,
      kAppResourceType.PresignedPath,
      workspaceId,
      {
        expiresAt,
        fileId,
        extension,
        actions: convertToArray(actions),
        namepath: namepath,
        issuerAgentTokenId: agent.agentTokenId,
        maxUsageCount: data.usageCount,
        spentUsageCount: 0,
      }
    );
    await kSemanticModels.presignedPath().insertItem(presignedPath, opts);
    return presignedPath;
  }, /** reuseTxn */ false);

  return {path: resource.resourceId};
};

export default issuePresignedPath;
