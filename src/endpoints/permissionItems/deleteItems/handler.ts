import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {DeletePermissionItemsEndpoint} from './types';
import {INTERNAL_deletePermissionItems} from './utils';
import {deletePermissionItemsJoiSchema} from './validation';

const deletePermissionItems: DeletePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorizationWithAgent({
    context,
    agent,
    workspaceId,
    workspace,
    target: {targetId: workspaceId, action: 'updatePermission'},
  });
  const job = await INTERNAL_deletePermissionItems(context, agent, workspace, data);
  return {jobId: job?.resourceId};
};

export default deletePermissionItems;
