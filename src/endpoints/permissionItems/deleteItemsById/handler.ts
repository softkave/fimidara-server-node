import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceExists} from '../../workspaces/utils';
import EndpointReusableQueries from '../../queries';
import {DeletePermissionItemsByIdEndpoint} from './types';
import {deletePermissionItemsByIdJoiSchema} from './validation';

const deletePermissionItemsById: DeletePermissionItemsByIdEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsByIdJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = await getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.GrantPermission,
    type: AppResourceType.PermissionItem,
    permissionOwners: makeWorkspacePermissionOwnerList(workspaceId),
  });

  await context.data.permissionItem.deleteManyItems(
    EndpointReusableQueries.getByWorkspaceIdAndIds(workspaceId, data.itemIds)
  );
};

export default deletePermissionItemsById;
