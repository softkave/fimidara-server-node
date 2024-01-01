import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {AddPermissionItemsEndpoint} from './types';
import {INTERNAL_addPermissionItems} from './utils';
import {addPermissionItemsJoiSchema} from './validation';

const addPermissionItems: AddPermissionItemsEndpoint = async instData => {
  const data = validate(instData.data, addPermissionItemsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = await getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
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
      async opts => await INTERNAL_addPermissionItems(agent, workspace, data, opts)
    );
};

export default addPermissionItems;
