import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {InvalidRequestError} from '../../errors.js';
import {checkPermissionGroupAuthorization03} from '../utils.js';
import {DeletePermissionGroupEndpoint} from './types.js';
import {beginDeletePermissionGroup} from './utils.js';
import {deletePermissionGroupJoiSchema} from './validation.js';

const deletePermissionGroup: DeletePermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, deletePermissionGroupJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {permissionGroup, workspace} = await checkPermissionGroupAuthorization03(
    agent,
    data,
    kFimidaraPermissionActionsMap.updatePermission
  );

  if (permissionGroup.resourceId === workspace.publicPermissionGroupId) {
    throw new InvalidRequestError("Cannot delete a workspace's public permission group");
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
