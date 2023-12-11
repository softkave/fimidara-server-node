import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {DeletePermissionItemsByIdEndpoint} from './types';
import {deletePermissionItemsByIdJoiSchema} from './validation';

const deletePermissionItemsById: DeletePermissionItemsByIdEndpoint = async instData => {
  const data = validate(instData.data, deletePermissionItemsByIdJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'updatePermission'},
  });
  await kSemanticModels
    .utils()
    .withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByIdList(data.itemIds, opts)
    );
};

export default deletePermissionItemsById;
