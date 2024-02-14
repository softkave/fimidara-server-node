import {kPermissionsMap} from '../../../definitions/permissionItem';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {
  DeletePermissionItemsEndpoint,
  DeletePermissionItemsEndpointResult,
} from './types';
import {INTERNAL_deletePermissionItems} from './utils';
import {deletePermissionItemsJoiSchema} from './validation';

const deletePermissionItems: DeletePermissionItemsEndpoint = async instData => {
  const data = validate(instData.data, deletePermissionItemsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspaceId,
    workspace,
    target: {targetId: workspaceId, action: kPermissionsMap.updatePermission},
  });

  const jobs = await INTERNAL_deletePermissionItems(agent, workspace, data);
  const result = jobs.reduce(
    (acc, job) => {
      acc.push({jobId: job.resourceId, resourceId: job.params.args.resourceId});
      return acc;
    },
    [] as DeletePermissionItemsEndpointResult['jobs']
  );

  return {jobs: result};
};

export default deletePermissionItems;
