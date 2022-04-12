import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import checkEntitiesExist from '../checkEntitiesExist';
import PermissionItemQueries from '../queries';
import PermissionItemsQueries from '../queries';
import {DeletePermissionItemsByEntityEndpoint} from './types';
import {deletePermissionItemsByEntityJoiSchema} from './validation';

const deletePermissionItemsByEntity: DeletePermissionItemsByEntityEndpoint =
  async (context, instData) => {
    const data = validate(
      instData.data,
      deletePermissionItemsByEntityJoiSchema
    );

    const agent = await context.session.getAgent(context, instData);
    const workspace = await checkWorkspaceExists(context, data.workspaceId);

    await checkEntitiesExist(context, agent, workspace, [data]);
    await checkAuthorization({
      context,
      agent,
      workspace,
      action: BasicCRUDActions.GrantPermission,
      type: AppResourceType.PermissionItem,
      permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
    });

    await waitOnPromises([
      // Delete permission items that explicitly give access
      // to the resources to be deleted
      ...data.itemIds.map(id => {
        return context.data.permissionItem.deleteManyItems(
          PermissionItemQueries.getByResource(
            workspace.resourceId,
            id,
            AppResourceType.PermissionItem
          )
        );
      }),

      context.data.permissionItem.deleteManyItems(
        PermissionItemsQueries.getByIds(data.itemIds, workspace.resourceId)
      ),
    ]);
  };

export default deletePermissionItemsByEntity;
