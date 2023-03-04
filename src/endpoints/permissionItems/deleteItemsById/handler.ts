import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {DeletePermissionItemsByIdEndpoint} from './types';
import {deletePermissionItemsByIdJoiSchema} from './validation';

const deletePermissionItemsById: DeletePermissionItemsByIdEndpoint = async (context, instData) => {
  const data = validate(instData.data, deletePermissionItemsByIdJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Delete,
    targets: [{type: AppResourceType.PermissionItem}],
  });
  await context.semantic.permissionItem.deleteManyByIdList(data.itemIds);
};

export default deletePermissionItemsById;
