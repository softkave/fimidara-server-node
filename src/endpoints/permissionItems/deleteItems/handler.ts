import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {checkOrganizationExists} from '../../organizations/utils';
import checkEntityExists from '../checkEntityExists';
import PermissionItemQueries from '../queries';
import PermissionItemsQueries from '../queries';
import {DeletePermissionItemsEndpoint} from './types';
import {deletePermissionItemsJoiSchema} from './validation';

const deletePermissionItems: DeletePermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  /**
   * Entity auth check is enough for permission items cause permission items are
   * basically extensions of the entites and are considered to belong to the entities.
   */
  await checkEntityExists(
    context,
    agent,
    organization.organizationId,
    data.permissionEntityId,
    data.permissionEntityType
  );

  await waitOnPromises([
    // Delete permission items that explicitly give access to the resources to be deleted
    ...data.itemIds.map(id => {
      return context.data.permissionItem.deleteManyItems(
        PermissionItemQueries.getByResource(id, AppResourceType.PermissionItem)
      );
    }),

    context.data.permissionItem.deleteManyItems(
      PermissionItemsQueries.getByIds(data.itemIds, organization.organizationId)
    ),
  ]);
};

export default deletePermissionItems;
