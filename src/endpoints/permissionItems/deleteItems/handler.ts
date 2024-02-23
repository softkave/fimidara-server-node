import {kPermissionsMap} from '../../../definitions/permissionItem';
import {extractResourceIdList} from '../../../utils/fns';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {DeletePermissionItemsEndpoint} from './types';
import {beginDeletePermissionItemByInput} from './utils';
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

  const jobs = await beginDeletePermissionItemByInput({
    agent,
    workspaceId,
    items: data.items,
  });

  return {jobIds: extractResourceIdList(jobs)};
};

export default deletePermissionItems;
