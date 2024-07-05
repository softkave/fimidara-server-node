import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {checkWorkspaceExists} from '../../workspaces/utils.js';
import {AddPermissionItemsEndpoint} from './types.js';
import {INTERNAL_addPermissionItems} from './utils.js';
import {addPermissionItemsJoiSchema} from './validation.js';

const addPermissionItems: AddPermissionItemsEndpoint = async reqData => {
  const data = validate(reqData.data, addPermissionItemsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspaceId = await getWorkspaceIdFromSessionAgent(
    agent,
    data.workspaceId
  );
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'updatePermission'},
  });
  await kSemanticModels
    .utils()
    .withTxn(
      async opts =>
        await INTERNAL_addPermissionItems(agent, workspace, data, opts)
    );
};

export default addPermissionItems;
