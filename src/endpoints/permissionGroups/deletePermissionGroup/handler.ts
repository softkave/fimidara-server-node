import {AppResourceTypeMap} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {InvalidRequestError} from '../../errors';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkPermissionGroupAuthorization03} from '../utils';
import {DeletePermissionGroupEndpoint} from './types';
import {deletePermissionGroupJoiSchema} from './validation';

const deletePermissionGroup: DeletePermissionGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {permissionGroup, workspace} = await checkPermissionGroupAuthorization03(
    agent,
    data,
    'updatePermission'
  );

  if (permissionGroup.resourceId === workspace.publicPermissionGroupId) {
    throw new InvalidRequestError(
      "Cannot delete the workspace's public public permission group."
    );
  }

  const job = await enqueueDeleteResourceJob({
    type: AppResourceTypeMap.PermissionGroup,
    args: {workspaceId: workspace.resourceId, resourceId: permissionGroup.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deletePermissionGroup;
