import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
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
    const organization = await checkOrganizationExists(
      context,
      data.organizationId
    );

    await checkEntitiesExist(context, agent, organization, [data]);
    await checkAuthorization({
      context,
      agent,
      organization,
      action: BasicCRUDActions.GrantPermission,
      type: AppResourceType.PermissionItem,
      permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    });

    await waitOnPromises([
      // Delete permission items that explicitly give access
      // to the resources to be deleted
      ...data.itemIds.map(id => {
        return context.data.permissionItem.deleteManyItems(
          PermissionItemQueries.getByResource(
            organization.resourceId,
            id,
            AppResourceType.PermissionItem
          )
        );
      }),

      context.data.permissionItem.deleteManyItems(
        PermissionItemsQueries.getByIds(data.itemIds, organization.resourceId)
      ),
    ]);
  };

export default deletePermissionItemsByEntity;
