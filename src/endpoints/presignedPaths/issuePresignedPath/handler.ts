import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {PresignedPath} from '../../../definitions/presignedPath.js';
import {Resource, kFimidaraResourceType} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {convertToArray} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {getFileWithMatcher} from '../../files/getFilesWithMatcher.js';
import {getFilepathInfo} from '../../files/utils.js';
import {getClosestExistingFolder} from '../../folders/getFolderWithMatcher.js';
import {assertRootname, assertWorkspace} from '../../workspaces/utils.js';
import {IssuePresignedPathEndpoint} from './types.js';
import {issuePresignedPathJoiSchema} from './validation.js';

const issuePresignedPath: IssuePresignedPathEndpoint = async reqData => {
  const data = validate(reqData.data, issuePresignedPathJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const actions = data.action || [kFimidaraPermissionActions.readFile];

  const resource = await await kIjxSemantic.utils().withTxn(async opts => {
    const {file} = await getFileWithMatcher({
      opts,
      matcher: data,
      incrementPresignedPathUsageCount: true,
      supportPresignedPath: true,
    });
    let workspace: Workspace | undefined | null = undefined,
      namepath: string[],
      ext: string | undefined,
      fileId: string | undefined,
      permissionTarget: Resource,
      workspaceId: string;

    if (file) {
      // Happy path. Extract necessary data and continue.
      ({namepath, ext, workspaceId, resourceId: fileId} = file);
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
      const pathinfo = getFilepathInfo(data.filepath, {
        containsRootname: true,
        allowRootFolder: false,
      });
      ({namepath, ext} = pathinfo);

      assertRootname(pathinfo.rootname);
      workspace = await kIjxSemantic
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
      kFimidaraResourceType.PresignedPath,
      workspaceId,
      {
        expiresAt,
        fileId,
        ext,
        actions: convertToArray(actions),
        namepath: namepath,
        issuerAgentTokenId: agent.agentTokenId,
        maxUsageCount: data.usageCount,
        spentUsageCount: 0,
      }
    );
    await kIjxSemantic.presignedPath().insertItem(presignedPath, opts);
    return presignedPath;
  });

  return {path: resource.resourceId};
};

export default issuePresignedPath;
