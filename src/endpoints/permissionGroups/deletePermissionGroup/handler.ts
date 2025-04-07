import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidRequestError} from '../../errors.js';
import {checkPermissionGroupAuthorization03} from '../utils.js';
import {DeletePermissionGroupEndpoint} from './types.js';
import {beginDeletePermissionGroup} from './utils.js';
import {deletePermissionGroupJoiSchema} from './validation.js';

const deletePermissionGroup: DeletePermissionGroupEndpoint = async reqData => {
  const data = validate(reqData.data, deletePermissionGroupJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {permissionGroup, workspace} =
    await checkPermissionGroupAuthorization03(
      agent,
      data,
      kFimidaraPermissionActions.updatePermission
    );

  if (permissionGroup.resourceId === workspace.publicPermissionGroupId) {
    throw new InvalidRequestError(
      "Cannot delete a workspace's public permission group"
    );
  }

  const [job] = await beginDeletePermissionGroup({
    agent,
    workspaceId: workspace.resourceId,
    resources: [permissionGroup],
  });
  appAssert(job, 'Could not create job');

  return {jobId: job.resourceId};
};

export default deletePermissionGroup;
