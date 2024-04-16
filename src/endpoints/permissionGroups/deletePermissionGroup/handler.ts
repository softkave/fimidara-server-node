import {kPermissionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {InvalidRequestError} from '../../errors';
import {checkPermissionGroupAuthorization03} from '../utils';
import {DeletePermissionGroupEndpoint} from './types';
import {beginDeletePermissionGroup} from './utils';
import {deletePermissionGroupJoiSchema} from './validation';

const deletePermissionGroup: DeletePermissionGroupEndpoint = async instData => {
  const data = validate(instData.data, deletePermissionGroupJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {permissionGroup, workspace} = await checkPermissionGroupAuthorization03(
    agent,
    data,
    kPermissionsMap.updatePermission
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
