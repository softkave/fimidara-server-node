import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {checkWorkspaceExists} from '../../workspaces/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import {default as PermissionItemQueries} from '../queries';
import {DeletePermissionItemsByEntityEndpoint} from './types';
import {deletePermissionItemsByEntityJoiSchema} from './validation';

const deletePermissionItemsByEntity: DeletePermissionItemsByEntityEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsByEntityJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);

  await checkEntitiesExist(context, agent, workspace, [data]);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.GrantPermission,
    type: AppResourceType.PermissionItem,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  await waitOnPromises([
    // Delete permission items that explicitly give access
    // to the resources to be deleted
    ...data.itemIds.map(id => {
      return context.data.permissionItem.deleteManyByQuery(
        PermissionItemQueries.getByResource(
          workspace.resourceId,
          id,
          AppResourceType.PermissionItem
        )
      );
    }),

    context.data.permissionItem.deleteManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(workspace.resourceId, data.itemIds)
    ),
  ]);
};

export default deletePermissionItemsByEntity;
