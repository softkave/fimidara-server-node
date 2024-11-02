import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkPermissionGroupAuthorization03} from '../utils.js';
import {DeletePermissionGroupEndpoint} from './types.js';
import {beginDeletePermissionGroup} from './utils.js';
import {deletePermissionGroupJoiSchema} from './validation.js';

const deletePermissionGroupEndpoint: DeletePermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, deletePermissionGroupJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.updatePermission,
    });

    const {permissionGroup} = await checkPermissionGroupAuthorization03(
      agent,
      data,
      kFimidaraPermissionActions.updatePermission
    );

    const [job] = await beginDeletePermissionGroup({
      agent,
      workspaceId: workspace.resourceId,
      resources: [permissionGroup],
    });

    appAssert(
      job,
      new ServerError(),
      'Could not create deletePermissionGroup job'
    );
    return {jobId: job.resourceId};
  };

export default deletePermissionGroupEndpoint;
