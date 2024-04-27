import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {extractResourceIdList} from '../../../utils/fns';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {DeletePermissionItemsEndpoint} from './types';
import {beginDeletePermissionItemByInput} from './utils';
import {deletePermissionItemsJoiSchema} from './validation';

const deletePermissionItems: DeletePermissionItemsEndpoint = async instData => {
  const data = validate(instData.data, deletePermissionItemsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspaceId,
    workspace,
    target: {
      targetId: workspaceId,
      action: kFimidaraPermissionActionsMap.updatePermission,
    },
  });

  const jobs = await beginDeletePermissionItemByInput({
    agent,
    workspaceId,
    items: data.items,
  });

  return {jobIds: extractResourceIdList(jobs)};
};

export default deletePermissionItems;
