import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkPermissionGroupAuthorization,
  getPermissionGroupByMatcher,
} from '../utils.js';
import {DeletePermissionGroupEndpoint} from './types.js';
import {beginDeletePermissionGroup} from './utils.js';
import {deletePermissionGroupJoiSchema} from './validation.js';

const deletePermissionGroupEndpoint: DeletePermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, deletePermissionGroupJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {permissionGroup} = await getPermissionGroupByMatcher(
      workspaceId,
      data
    );
    await checkPermissionGroupAuthorization(
      agent,
      permissionGroup,
      kFimidaraPermissionActions.updatePermission
    );

    const [job] = await beginDeletePermissionGroup({
      agent,
      workspaceId,
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
