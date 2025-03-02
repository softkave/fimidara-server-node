import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {DeletePermissionItemsEndpoint} from './types.js';
import {beginDeletePermissionItemByInput} from './utils.js';
import {deletePermissionItemsJoiSchema} from './validation.js';

const deletePermissionItems: DeletePermissionItemsEndpoint = async reqData => {
  const data = validate(reqData.data, deletePermissionItemsJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
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
      action: kFimidaraPermissionActions.updatePermission,
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
