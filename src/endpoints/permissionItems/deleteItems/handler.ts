import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {DeletePermissionItemsEndpoint} from './types.js';
import {beginDeletePermissionItemByInput} from './utils.js';
import {deletePermissionItemsJoiSchema} from './validation.js';

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
